import { streamObject } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import { evalSet } from '@/lib/evals';
import { NYC311_ROWS, NYC311_SCHEMA, execLocal } from '@/lib/eval-corpus';
import { estimateCost } from '@/lib/pricing';
import { formatRetryAfter, reserveMonthly } from '@/lib/rate-limit';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';
export const maxDuration = 300;

const responseSchema = z.object({
  reasoning: z.string(),
  sql: z.string(),
  renderKind: z.enum(['table', 'bar', 'line', 'stat', 'list']),
  renderHint: z.string(),
});

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Eval is ~12 model calls per run. 5 runs/hour/IP gives a visitor
// enough headroom to stress-test the demo without burning budget. The
// monthly Gateway cap is the hard ceiling underneath.
const evalLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'tablesalt:eval',
    })
  : null;

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

// Normalize SQL for fuzzy semantic match. Forgive cosmetic differences
// between the expected and actual SQL — aliases, type casts, COUNT
// variants, ORDER BY direction, trailing punctuation. We're scoring
// whether the model produced the SAME QUERY, not the same characters.
function normalizeSql(sql: string): string {
  return sql
    .replace(/;\s*$/, '')
    // Strip column aliases (FROM data AS x, AS alias, etc.)
    .replace(/\s+AS\s+\w+/gi, '')
    // Strip explicit type casts.
    .replace(/::\w+/g, '')
    // COUNT(complaint_id), COUNT(*), COUNT(1) — all the same in this corpus.
    .replace(/count\s*\(\s*[\w*]+\s*\)/gi, 'COUNT(*)')
    // ORDER BY direction collapses to DESC for our top-N patterns.
    .replace(/\s+ORDER\s+BY\s+([^.]+?)\s+ASC\b/gi, ' ORDER BY $1 DESC')
    // Default LIMIT 50 ≡ no LIMIT for table-shaped results.
    .replace(/\s+LIMIT\s+(50|200)\b/gi, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function semanticMatch(actual: string, expected: string): boolean {
  return normalizeSql(actual) === normalizeSql(expected);
}

export async function POST(req: Request) {
  if (evalLimiter) {
    const { success, reset } = await evalLimiter.limit(getClientIp(req));
    if (!success) {
      return new Response(
        JSON.stringify({
          error: 'rate-limited',
          message: "You've hit the per-visitor eval cap (5/hour). Cooling off.",
          retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
        }),
        { status: 429, headers: { 'content-type': 'application/json' } },
      );
    }
  }

  // Reserve N model calls against the monthly cap before starting the
  // 12-case run. If we'd blow the budget we reject without spending.
  const reservation = await reserveMonthly(evalSet.length);
  if (!reservation.ok) {
    return new Response(
      JSON.stringify({
        error: 'monthly-cap',
        message: `tablesalt has reached this month's demo budget. New budget resets in ${formatRetryAfter(reservation.retryAfterSeconds)}. Run it locally in the meantime — it's open source.`,
        retryAfterSeconds: reservation.retryAfterSeconds,
      }),
      { status: 429, headers: { 'content-type': 'application/json' } },
    );
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI_GATEWAY_API_KEY not configured.' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }

  const modelId = process.env.TABLESALT_MODEL ?? 'openai/gpt-4o-mini';
  const model = gateway(modelId);

  const schemaLines = NYC311_SCHEMA
    .map((c) => `  "${c.name}" ${c.type.toUpperCase()}${c.sample.length > 0 ? `  -- e.g. ${c.sample.slice(0, 4).join(', ')}` : ''}`)
    .join('\n');
  const sample = NYC311_ROWS.slice(0, 3);
  const system = `You are tablesalt, a careful data-exploration agent.
You answer the user's question about a single table named \`data\` by writing one DuckDB SQL statement and choosing how it should be rendered.

Hard rules:
- Use DuckDB SQL dialect.
- Reference only the columns provided in the schema below.
- No DDL, no INSERT/UPDATE/DELETE, no ATTACH, no COPY, no PRAGMA — read-only SELECT only.
- Always alias aggregate output columns with snake_case names.
- Cap LIMIT at 200. Default to 50 for table renders.
- For 'stat' renders, return exactly one row with one or two scalar columns.
- For 'bar' or 'line' renders, the SQL MUST return EXACTLY TWO columns: a label and a single numeric value. If you GROUP BY two or more columns, choose 'table' renderKind, not 'bar' or 'line'.
- For 'list' renders, return one or two text columns and LIMIT <= 20.

The table:
\`\`\`
CREATE TABLE data (
${schemaLines}
);  -- approximately ${NYC311_ROWS.length} rows
\`\`\`

A sample of 3 rows:
${JSON.stringify(sample, null, 2)}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
      };

      send({ kind: 'start', total: evalSet.length, model: modelId, startedAt: Date.now() });

      const allLatencies: number[] = [];
      let renderCorrect = 0;
      let sqlExecutes = 0;
      let sqlSemantic = 0;
      let totalCost = 0;

      for (let i = 0; i < evalSet.length; i++) {
        const c = evalSet[i];
        const startedAt = Date.now();
        send({ kind: 'case-start', index: i, id: c.id, question: c.question, expected: { sql: c.expectedSql, renderKind: c.expectedRenderKind } });

        try {
          const stream = streamObject({
            model,
            schema: responseSchema,
            system,
            prompt: c.question,
            temperature: 0,
          });

          // Stream partials WITHIN each case so the per-case row visibly
          // updates while the model is generating. Without this the user
          // sees a 5s "running…" then a snap to done — feels broken.
          for await (const partial of stream.partialObjectStream) {
            send({
              kind: 'case-partial',
              index: i,
              id: c.id,
              partial: {
                sql: partial.sql,
                renderKind: partial.renderKind,
                reasoning: partial.reasoning,
              },
            });
          }
          const result = await stream.object;

          // usage is a Promise that may reject on some Gateway responses —
          // don't let a missing usage tank the whole case verdict.
          let inputTokens: number | undefined;
          let outputTokens: number | undefined;
          try {
            const usage = await stream.usage;
            inputTokens = usage?.inputTokens;
            outputTokens = usage?.outputTokens;
          } catch {
            // best-effort only
          }

          const latencyMs = Date.now() - startedAt;
          allLatencies.push(latencyMs);

          const renderHit = result.renderKind === c.expectedRenderKind;
          if (renderHit) renderCorrect++;

          const localResult = execLocal(result.sql);
          const executesHit = !('error' in localResult);
          if (executesHit) sqlExecutes++;

          const semanticHit = semanticMatch(result.sql, c.expectedSql);
          if (semanticHit) sqlSemantic++;

          const cost = estimateCost(modelId, inputTokens, outputTokens);
          if (cost !== null) totalCost += cost;

          send({
            kind: 'case-done',
            index: i,
            id: c.id,
            latencyMs,
            costUsd: cost,
            inputTokens: inputTokens ?? null,
            outputTokens: outputTokens ?? null,
            actual: { sql: result.sql, renderKind: result.renderKind },
            verdict: { renderKind: renderHit, executes: executesHit, semanticMatch: semanticHit },
          });
        } catch (err) {
          const latencyMs = Date.now() - startedAt;
          allLatencies.push(latencyMs);
          send({
            kind: 'case-error',
            index: i,
            id: c.id,
            latencyMs,
            error: err instanceof Error ? err.message : 'unknown',
          });
        }
      }

      const meanLatency = allLatencies.length
        ? Math.round(allLatencies.reduce((s, n) => s + n, 0) / allLatencies.length)
        : 0;
      send({
        kind: 'done',
        total: evalSet.length,
        renderCorrect,
        sqlExecutes,
        sqlSemantic,
        meanLatencyMs: meanLatency,
        totalCostUsd: totalCost,
        model: modelId,
        finishedAt: Date.now(),
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson',
      'cache-control': 'no-store',
      // Disable proxy buffering on Vercel / nginx so each NDJSON line
      // flushes to the client immediately instead of being held in a
      // chunk. Without this, eval cases appear to land all at once.
      'x-accel-buffering': 'no',
    },
  });
}
