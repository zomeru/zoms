import { describe, expect, it } from "vitest";

import { createAiConfig } from "@/lib/ai/config";
import { parseAiEnv } from "@/lib/ai/env";

const createBaseEnv = (): NodeJS.ProcessEnv => ({
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:password@localhost:5432/zoms",
  DIRECT_URL: "postgresql://user:password@localhost:5432/zoms_direct",
  OPENROUTER_API_KEY: "openrouter-key",
  OPENROUTER_CHAT_MODEL: "openai/gpt-4.1-mini",
  UPSTASH_VECTOR_REST_URL: "https://vector.example.com",
  UPSTASH_VECTOR_REST_TOKEN: "vector-token",
  UPSTASH_REDIS_REST_URL: "https://redis.example.com",
  UPSTASH_REDIS_REST_TOKEN: "redis-token",
  AI_REINDEX_SECRET: "reindex-secret"
});

describe("parseAiEnv", () => {
  it("throws when required ai env vars are missing", () => {
    const env = createBaseEnv();
    delete env.OPENROUTER_API_KEY;

    expect(() => parseAiEnv(env)).toThrow(/OPENROUTER_API_KEY/i);
  });

  it("throws when prisma and neon env vars are missing", () => {
    const env = createBaseEnv();
    delete env.DATABASE_URL;
    delete env.DIRECT_URL;

    expect(() => parseAiEnv(env)).toThrow(/DATABASE_URL|DIRECT_URL/i);
  });

  it("throws when upstash vector or redis env vars are missing", () => {
    const env = createBaseEnv();
    delete env.UPSTASH_VECTOR_REST_URL;
    delete env.UPSTASH_REDIS_REST_TOKEN;

    expect(() => parseAiEnv(env)).toThrow(/UPSTASH_VECTOR_REST_URL|UPSTASH_REDIS_REST_TOKEN/i);
  });

  it("does not require an openrouter embedding model when upstash hosts embeddings", () => {
    expect(() => parseAiEnv(createBaseEnv())).not.toThrow();
  });

  it("returns chat, database, redis, vector, and auth config when env vars are valid", () => {
    const config = createAiConfig(createBaseEnv());

    expect(config.openRouter.chatModel).toBe("openai/gpt-4.1-mini");
    expect(config.database.directUrl).toBe("postgresql://user:password@localhost:5432/zoms_direct");
    expect(config.auth.reindexSecret).toBe("reindex-secret");
  });
});
