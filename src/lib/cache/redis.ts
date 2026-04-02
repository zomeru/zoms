import 'server-only';

import { Redis } from '@upstash/redis';

import { getAiEnv } from '@/lib/ai/env';

let cachedRedis: Redis | null | undefined;

export function getRedisClient(): Redis | null {
  if (cachedRedis !== undefined) {
    return cachedRedis;
  }

  try {
    const env = getAiEnv();
    cachedRedis = new Redis({
      token: env.UPSTASH_REDIS_REST_TOKEN,
      url: env.UPSTASH_REDIS_REST_URL
    });
  } catch {
    cachedRedis = null;
  }

  return cachedRedis;
}
