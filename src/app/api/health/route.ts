import { Redis } from '@upstash/redis';
import { MONTHLY_REQUEST_CAP } from '@/lib/rate-limit';

export const runtime = 'edge';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function utcMonthKey(now: Date = new Date()): string {
  return `tablesalt:month:${now.toISOString().slice(0, 7)}`;
}

/**
 * Lightweight spend-tracker endpoint. Returns the current month's
 * total model-call count vs the configured cap, so the founder (or
 * anyone curious) can spot-check budget exposure without logging into
 * Upstash. Public endpoint, read-only, returns no PII.
 */
export async function GET() {
  if (!redis) {
    return Response.json({
      used: 0,
      cap: MONTHLY_REQUEST_CAP,
      percentRemaining: 100,
      note: 'Upstash not configured — limiter is failing open (local dev).',
    });
  }

  const used = Number((await redis.get<number>(utcMonthKey())) ?? 0);
  const remaining = Math.max(0, MONTHLY_REQUEST_CAP - used);
  const percentRemaining = MONTHLY_REQUEST_CAP > 0
    ? Math.round((remaining / MONTHLY_REQUEST_CAP) * 100)
    : 0;

  return Response.json({
    month: new Date().toISOString().slice(0, 7),
    used,
    cap: MONTHLY_REQUEST_CAP,
    remaining,
    percentRemaining,
  });
}
