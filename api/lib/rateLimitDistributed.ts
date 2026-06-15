import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { checkRateLimit } from './rateLimit';

let ratelimitByMax: Map<number, Ratelimit> | null = null;

function getUpstashLimiter(maxRequests: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  if (!ratelimitByMax) ratelimitByMax = new Map();
  const existing = ratelimitByMax.get(maxRequests);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(maxRequests, '60 s'),
    prefix: 'wanderlog',
  });
  ratelimitByMax.set(maxRequests, limiter);
  return limiter;
}

export async function checkRateLimitAsync(
  key: string,
  maxRequests = 30,
  windowMs = 60_000,
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const upstash = getUpstashLimiter(maxRequests);
  if (upstash) {
    const result = await upstash.limit(key);
    if (result.success) return { allowed: true };
    const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return { allowed: false, retryAfterSec };
  }

  return checkRateLimit(key, maxRequests, windowMs);
}
