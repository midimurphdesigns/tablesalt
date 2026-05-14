import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Three-layer rate limiting / spend protection for tablesalt's API.
 *
 *   1. Per-IP sliding window — 10 requests / hour. Casual scraping +
 *      accidental loops.
 *   2. Daily global request cap — UTC-day counter across all visitors.
 *      Default 200/day.
 *   3. Monthly global request cap — UTC-month counter across all
 *      visitors. Default 3000/month. The hard ceiling on demo spend.
 *
 * At gpt-4o-mini pricing, 3000 agent calls cost roughly $1–2 — far
 * below Vercel AI Gateway's $50 credit floor. This is the
 * tablesalt-code-level budget guard; the Gateway is the
 * Vercel-billing-level guard. Either one trips, the spend stops.
 *
 * If Upstash env vars are missing the limiter fails open — every
 * request allowed. Intentional for local dev. In production both vars
 * must be set.
 */

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const perIpLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'tablesalt:ip',
    })
  : null;

const DAILY_REQUEST_CAP = Number(
  process.env.TABLESALT_DAILY_REQUEST_CAP ?? 200,
);
export const MONTHLY_REQUEST_CAP = Number(
  process.env.TABLESALT_MONTHLY_REQUEST_CAP ?? 1500,
);

type LimitResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'per-ip' | 'daily-cap' | 'monthly-cap';
      retryAfterSeconds: number;
    };

function utcDayKey(now: Date = new Date()): string {
  return `tablesalt:day:${now.toISOString().slice(0, 10)}`;
}

function utcMonthKey(now: Date = new Date()): string {
  return `tablesalt:month:${now.toISOString().slice(0, 7)}`;
}

function secondsUntilUtcMidnight(now: Date = new Date()): number {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000));
}

function secondsUntilUtcMonthEnd(now: Date = new Date()): number {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000));
}

export async function checkLimits(ip: string): Promise<LimitResult> {
  if (!redis || !perIpLimiter) return { ok: true };

  // 1. Per-IP check.
  const ipResult = await perIpLimiter.limit(ip);
  if (!ipResult.success) {
    return {
      ok: false,
      reason: 'per-ip',
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((ipResult.reset - Date.now()) / 1000),
      ),
    };
  }

  // 2. Monthly global cap. Check FIRST so we never write a day-counter
  //    if the month is already over budget.
  const monthKey = utcMonthKey();
  const monthCount = await redis.incr(monthKey);
  if (monthCount === 1) {
    // First write of the month — set TTL ~32 days so the key
    // garbage-collects after the new month starts.
    await redis.expire(monthKey, 32 * 24 * 60 * 60);
  }
  if (monthCount > MONTHLY_REQUEST_CAP) {
    return {
      ok: false,
      reason: 'monthly-cap',
      retryAfterSeconds: secondsUntilUtcMonthEnd(),
    };
  }

  // 3. Daily global cap.
  const dayKey = utcDayKey();
  const dayCount = await redis.incr(dayKey);
  if (dayCount === 1) {
    await redis.expire(dayKey, secondsUntilUtcMidnight() + 60);
  }
  if (dayCount > DAILY_REQUEST_CAP) {
    return {
      ok: false,
      reason: 'daily-cap',
      retryAfterSeconds: secondsUntilUtcMidnight(),
    };
  }

  return { ok: true };
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Reserve N requests against the monthly cap atomically. Returns ok if
 * the reservation fits under the cap, else rejects without writing.
 *
 * Used by routes that fan out multiple model calls per POST — like
 * /api/eval, which runs 12 calls per run. Reserving up-front means the
 * monthly cap math actually reflects model usage, not request count.
 */
export async function reserveMonthly(
  n: number,
): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  if (!redis) return { ok: true };
  const key = utcMonthKey();
  const after = await redis.incrby(key, n);
  if (after === n) {
    await redis.expire(key, 32 * 24 * 60 * 60);
  }
  if (after > MONTHLY_REQUEST_CAP) {
    // Roll back the reservation so a subsequent smaller request might fit.
    await redis.decrby(key, n);
    return { ok: false, retryAfterSeconds: secondsUntilUtcMonthEnd() };
  }
  return { ok: true };
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return `${m} minute${m === 1 ? '' : 's'}`;
  }
  if (seconds < 86_400) {
    const h = Math.floor(seconds / 3600);
    return `${h} hour${h === 1 ? '' : 's'}`;
  }
  const d = Math.floor(seconds / 86_400);
  return `${d} day${d === 1 ? '' : 's'}`;
}
