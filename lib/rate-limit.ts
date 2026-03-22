const windowMs = 60_000;

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}, 60_000);

export function rateLimit(
  key: string,
  limit: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    buckets.set(key, entry);
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}
