import { streamObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import type { ColumnProfile } from '@/lib/types';
import { checkLimits, formatRetryAfter, getClientIp } from '@/lib/rate-limit';

export const runtime = 'edge';
export const maxDuration = 30;

const responseSchema = z.object({
  steps: z
    .array(
      z.object({
        tool: z
          .enum(['profile_schema', 'pick_render_kind', 'draft_sql', 'validate_sql'])
          .describe(
            'Which agent step this is. Always emit in this exact order: profile_schema, pick_render_kind, draft_sql, validate_sql.',
          ),
        note: z
          .string()
          .describe(
            'One short sentence explaining what you concluded in this step. Speak to the user.',
          ),
      }),
    )
    .min(4)
    .max(4)
    .describe(
      "The agent's reasoning trace. Always exactly 4 steps in this order: (1) profile_schema — what you noticed about the data; (2) pick_render_kind — which render kind you chose and why; (3) draft_sql — what query you wrote; (4) validate_sql — what you checked before returning.",
    ),
  reasoning: z
    .string()
    .describe(
      "One short paragraph (2-3 sentences) summarizing your interpretation of the user's question. Speak to the user directly.",
    ),
  sql: z
    .string()
    .describe(
      "A single DuckDB SQL statement that answers the question. Reference the table as `data`. No semicolons. Cast aggregates to DOUBLE for predictable numeric output. Quote identifiers with embedded spaces.",
    ),
  renderKind: z
    .enum(['table', 'bar', 'line', 'stat', 'list'])
    .describe(
      "How the result should be rendered. 'stat' for a single numeric scalar answer. 'bar' for grouped aggregates with a categorical axis. 'line' for time-series. 'list' for a small number of text rows. 'table' for everything else.",
    ),
  renderHint: z
    .string()
    .describe(
      "One sentence — a short caption that contextualizes the rendered result for the user (e.g., 'Top 10 boroughs by complaint volume, March 2024').",
    ),
});

type Body = {
  question: string;
  columns: ColumnProfile[];
  rowCount: number;
  sampleRows?: Array<Record<string, unknown>>;
};

// tablesalt routes every model call through Vercel's AI Gateway. The
// Gateway handles provider keys, billing, fallback, and observability.
// One env var (AI_GATEWAY_API_KEY) replaces every direct provider key.
// Switch models by changing TABLESALT_MODEL — no redeploy of keys.
function pickModel() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      'AI_GATEWAY_API_KEY is not set. Add it in Vercel environment variables.',
    );
  }
  const id = process.env.TABLESALT_MODEL ?? 'openai/gpt-4o-mini';
  return gateway(id);
}

export async function POST(req: Request) {
  // Rate limit + daily cap. Fails open in local dev when Upstash isn't
  // configured; in production both env vars must be set.
  const ip = getClientIp(req);
  const limit = await checkLimits(ip);
  if (!limit.ok) {
    const message =
      limit.reason === 'per-ip'
        ? "You're sending questions a little fast — give it a minute and try again."
        : limit.reason === 'daily-cap'
          ? "tablesalt has hit its daily query budget. Come back tomorrow or run it locally — it's open source."
          : `tablesalt has reached this month's demo budget. New budget resets in ${formatRetryAfter(limit.retryAfterSeconds)}. Run it locally in the meantime — it's open source.`;
    return new Response(message, {
      status: 429,
      headers: { 'retry-after': String(limit.retryAfterSeconds) },
    });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }
  const { question, columns, rowCount, sampleRows } = body;
  if (!question || typeof question !== 'string' || question.length > 500) {
    return new Response('Question must be a non-empty string under 500 chars.', {
      status: 400,
    });
  }
  if (!Array.isArray(columns) || columns.length === 0) {
    return new Response('Schema is required.', { status: 400 });
  }

  const schemaLines = columns
    .map(
      (c) =>
        `  "${c.name}" ${c.type.toUpperCase()}${c.cardinality < 30 && c.sample.length > 0 ? `  -- e.g. ${c.sample.slice(0, 4).join(', ')}` : ''}`,
    )
    .join('\n');

  const sampleBlock = sampleRows && sampleRows.length > 0
    ? `\n\nA sample of 3 rows (for shape, not for filter values):\n${JSON.stringify(sampleRows.slice(0, 3), null, 2)}`
    : '';

  const system = `You are tablesalt, a careful data-exploration agent.
You answer the user's question about a single table named \`data\` by writing one DuckDB SQL statement and choosing how it should be rendered.

Hard rules:
- Use DuckDB SQL dialect.
- Reference only the columns provided in the schema below.
- No DDL, no INSERT/UPDATE/DELETE, no ATTACH, no COPY, no PRAGMA — read-only SELECT only.
- Always alias aggregate output columns with snake_case names.
- Cap LIMIT at 200. Default to 50 for table renders.
- Prefer one-column-by-one-column aggregates for bar/line renders.
- For 'stat' renders, the SQL must return exactly one row with one or two scalar columns.
- For 'bar' or 'line' renders, the SQL MUST return EXACTLY TWO columns: a label (string or date) and a single numeric value. If you GROUP BY two or more columns, you MUST choose 'table' renderKind — never 'bar' or 'line'. A crosstab (e.g., GROUP BY borough, status) is ALWAYS 'table'.
- For 'list' renders, the SQL must return one or two text columns and LIMIT <= 20.
- Before finalizing, re-read your SQL: count the columns in your SELECT clause. If renderKind is 'bar' or 'line' and the column count is not exactly 2, switch renderKind to 'table'.

The table:
\`\`\`
CREATE TABLE data (
${schemaLines}
);  -- approximately ${rowCount} rows
\`\`\`${sampleBlock}

Vague question protocol:
- If the user asks something open-ended like "what are the key correlations?" or "summarize this data" or "tell me something interesting", DO NOT default to SELECT COUNT(*). Instead, pick the most informative exploratory query you can defend:
  - Prefer GROUP BY on the lowest-cardinality categorical column with the highest-cardinality numeric column aggregated.
  - If no numeric columns, GROUP BY on two categoricals (the lowest-cardinality pair) and produce a crosstab counts table.
  - If only one column matters, GROUP BY that column with COUNT(*).
- For "summary" / "overview" questions, produce a bar chart of the most informative grouping, never a single scalar.
- The render kind must reflect what the query actually returns — never claim "stat" for a multi-row result.

Now answer the user's question. You must emit your reasoning as 4 steps in order: (1) profile_schema, (2) pick_render_kind, (3) draft_sql, (4) validate_sql. Each step's note is one short sentence the user will see live as you think. Then return the final summary, SQL, render kind, and caption. Be brief.`;

  let model;
  try {
    model = pickModel();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Model not configured.';
    return new Response(message, { status: 500 });
  }

  const result = streamObject({
    model,
    schema: responseSchema,
    system,
    prompt: question,
    temperature: 0,
  });

  // Pipe partial-object snapshots as NDJSON. Each line is a JSON object
  // with whatever fields the model has produced so far. The client diffs
  // them and shows the reasoning trace + final answer revealing in real
  // time. `toTextStreamResponse()` would emit raw chunked bytes which is
  // harder to parse incrementally on the client.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const partial of result.partialObjectStream) {
          controller.enqueue(encoder.encode(JSON.stringify(partial) + '\n'));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ __error: err instanceof Error ? err.message : 'stream failed' }) + '\n',
          ),
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson',
      'cache-control': 'no-store',
    },
  });
}
