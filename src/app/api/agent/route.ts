import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { ColumnProfile } from '@/lib/types';
import { checkLimits, getClientIp } from '@/lib/rate-limit';

export const runtime = 'edge';
export const maxDuration = 30;

const responseSchema = z.object({
  reasoning: z
    .string()
    .describe(
      "One short paragraph (2-3 sentences) explaining your interpretation of the user's question and why you chose this query shape and render kind. Speak to the user directly, not about them.",
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

function pickModel() {
  const provider = (process.env.TABLESALT_MODEL_PROVIDER ?? 'openai').toLowerCase();
  if (provider === 'anthropic') {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'TABLESALT_MODEL_PROVIDER is "anthropic" but ANTHROPIC_API_KEY is not set.',
      );
    }
    return anthropic('claude-haiku-4-5');
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it in Vercel environment variables, or set TABLESALT_MODEL_PROVIDER=anthropic with ANTHROPIC_API_KEY.',
    );
  }
  return openai('gpt-4o-mini');
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
        : "tablesalt has hit its daily query budget. Come back tomorrow or run it locally — it's open source.";
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
- For 'bar' or 'line' renders, the SQL must return exactly two columns: a label (string or date) and a numeric value.
- For 'list' renders, the SQL must return one or two text columns and LIMIT <= 20.

The table:
\`\`\`
CREATE TABLE data (
${schemaLines}
);  -- approximately ${rowCount} rows
\`\`\`${sampleBlock}

Now answer the user's question. Be brief in reasoning. Choose the render kind that lets the answer speak for itself.`;

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

  return result.toTextStreamResponse();
}
