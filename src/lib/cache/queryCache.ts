import "server-only";

import { createHash } from "node:crypto";

import { tryParseJson } from "@/lib/json";

import { getRedisClient } from "./redis";

function normalizeKey(key: string): string {
  return createHash("sha256").update(key.trim().toLowerCase()).digest("hex");
}

interface QueryCacheOptions<T> {
  parse?: (value: unknown) => T | undefined;
  ttlSeconds?: number;
}

export async function withQueryCache<T>(
  key: string,
  loader: () => Promise<T>,
  options?: QueryCacheOptions<T>
): Promise<T> {
  const redis = getRedisClient();
  const ttlSeconds = options?.ttlSeconds ?? 300;

  if (!redis) {
    return await loader();
  }

  const redisKey = `ai:query:${normalizeKey(key)}`;
  const cachedValue = await redis.get<string>(redisKey);

  if (cachedValue) {
    const parsedValue = tryParseJson(cachedValue);
    const cachedResult = options?.parse?.(parsedValue);

    if (cachedResult !== undefined) {
      return cachedResult;
    }
  }

  const value = await loader();
  await redis.set(redisKey, JSON.stringify(value), { ex: ttlSeconds });
  return value;
}
