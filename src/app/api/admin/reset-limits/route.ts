import { Redis } from '@upstash/redis';

export const runtime = 'edge';

/**
 * Owner-only endpoint to wipe tablesalt's rate-limit + spend keys so the
 * founder can keep iterating against the live demo without waiting for
 * the hourly / daily / monthly windows to roll over.
 *
 * Authorization: must pass `?key=$TABLESALT_ADMIN_KEY` matching the env
 * var. Default-deny: missing env var or missing/wrong key returns 404
 * (NOT 403) so the route can't be enumerated.
 *
 * Scope of the wipe:
 *   - `tablesalt:ip:*`     (per-IP sliding window — Ratelimit's own keys)
 *   - `tablesalt:eval:*`   (per-IP eval limiter)
 *   - `tablesalt:day:*`    (global daily counter)
 *   - `tablesalt:month:*`  (global monthly counter — the spend ceiling)
 */
export async function POST(req: Request) {
  const adminKey = process.env.TABLESALT_ADMIN_KEY;
  if (!adminKey) {
    return new Response('Not found', { status: 404 });
  }

  const url = new URL(req.url);
  const providedKey = url.searchParams.get('key');
  if (!providedKey || providedKey !== adminKey) {
    return new Response('Not found', { status: 404 });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Response.json({ error: 'Upstash not configured.' }, { status: 500 });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // SCAN + DEL per prefix. SCAN is cursor-paginated so we don't block
  // the Redis instance on a single huge KEYS call.
  const prefixes = ['tablesalt:ip:', 'tablesalt:eval:', 'tablesalt:day:', 'tablesalt:month:'];
  const deletedByPrefix: Record<string, number> = {};

  for (const prefix of prefixes) {
    let cursor: string | number = 0;
    let deleted = 0;
    do {
      // Upstash SCAN returns [nextCursor, keys[]]
      const [next, keys] = (await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 200,
      })) as [string | number, string[]];
      cursor = next;
      if (keys.length > 0) {
        deleted += await redis.del(...keys);
      }
    } while (String(cursor) !== '0');
    deletedByPrefix[prefix] = deleted;
  }

  return Response.json({
    ok: true,
    deletedByPrefix,
    total: Object.values(deletedByPrefix).reduce((s, n) => s + n, 0),
  });
}
