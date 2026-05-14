import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting + daily budget cap for /api/agent.
 *
 * Two protections:
 *
 * 1. Per-IP sliding window — 10 requests / hour / IP. Caps casual
 *    scraping and accidental loops without making the demo feel
 *    stingy. A genuine visitor exploring 3 datasets at 2 questions
 *    each lands well under the limit.
 *
 * 2. Daily global request cap — caps total agent calls per UTC day
 *    across every visitor. Belt-and-suspenders over the AI Gateway
 *    monthly cap; the global cap fires first and surfaces a friendly
 *    message rather than the gateway's hard 4xx.
 *
 * If Upstash env vars are missing the limiter fails open — every
 * request allowed. Intentional for local dev. In production both vars
 * must be set; the agent route logs a warning at module-load time if
 * they aren't.
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

type LimitResult =
  | { ok: true }
  | { ok: false; reason: 'per-ip' | 'daily-cap'; retryAfterSeconds: number };

function utcDayKey(now: Date = new Date()): string {
  return `tablesalt:day:${now.toISOString().slice(0, 10)}`;
}

function secondsUntilUtcMidnight(now: Date = new Date()): number {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000));
}

export async function checkLimits(ip: string): Promise<LimitResult> {
  // Fail open in local dev when Upstash isn't configured.
  if (!redis || !perIpLimiter) return { ok: true };

  // 1. Per-IP check.
  const ipResult = await perIpLimiter.limit(ip);
  if (!ipResult.success) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((ipResult.reset - Date.now()) / 1000),
    );
    return { ok: false, reason: 'per-ip', retryAfterSeconds };
  }

  // 2. Daily global cap. Increments a UTC-day counter; rejects when over.
  const key = utcDayKey();
  const count = await redis.incr(key);
  if (count === 1) {
    // First write of the day — set TTL so the key garbage-collects.
    await redis.expire(key, secondsUntilUtcMidnight() + 60);
  }
  if (count > DAILY_REQUEST_CAP) {
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
