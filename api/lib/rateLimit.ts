import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

const buckets = new Map<string, { count: number; reset: number }>();

function checkMemoryRateLimit(uid: string): boolean {
  const now = Date.now();
  let b = buckets.get(uid);
  if (!b || now > b.reset) {
    buckets.set(uid, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (b.count >= MAX_PER_WINDOW) return false;
  b.count += 1;
  return true;
}

let upstashRatelimit: Ratelimit | null | undefined;

function getUpstashRatelimit(): Ratelimit | null {
  if (upstashRatelimit !== undefined) return upstashRatelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    upstashRatelimit = null;
    return null;
  }
  const redis = new Redis({ url, token });
  upstashRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_PER_WINDOW, '60 s'),
    prefix: 'wanderlog:gemini',
  });
  return upstashRatelimit;
}

export async function checkGeminiRateLimit(uid: string): Promise<boolean> {
  const rl = getUpstashRatelimit();
  if (rl) {
    const { success } = await rl.limit(uid);
    return success;
  }
  return checkMemoryRateLimit(uid);
}
