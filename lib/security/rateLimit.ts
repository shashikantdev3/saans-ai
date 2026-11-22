/**
 * Fixed-window rate limit per client IP and route, kept in memory.
 * On serverless hosts each instance has its own counters, so this is a guard against
 * casual abuse, not a hard global limit. No user data is kept: only a hashed key and a count.
 */
import { createHash } from 'node:crypto';

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateLimitResult {
    const t = this.now();
    if (this.buckets.size > 5000) this.sweep(t);
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= t) {
      this.buckets.set(key, { count: 1, resetAt: t + this.windowMs });
      return { ok: true, retryAfterSeconds: 0 };
    }
    bucket.count += 1;
    const ok = bucket.count <= this.limit;
    return { ok, retryAfterSeconds: ok ? 0 : Math.ceil((bucket.resetAt - t) / 1000) };
  }

  private sweep(t: number): void {
    for (const [k, b] of this.buckets) if (b.resetAt <= t) this.buckets.delete(k);
  }
}

/** First address in x-forwarded-for (set by Vercel and Cloud Run), hashed so raw IPs are never held. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || headers.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

const MINUTE = 60_000;

export const limiters = {
  geocode: new RateLimiter(30, MINUTE),
  airQuality: new RateLimiter(30, MINUTE),
  plan: new RateLimiter(10, MINUTE),
  chat: new RateLimiter(8, MINUTE),
};
