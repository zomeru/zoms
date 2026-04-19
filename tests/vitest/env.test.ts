import { describe, expect, it } from "vitest";

import { createAiConfig } from "@/lib/ai/config";
import { parseAiEnv } from "@/lib/ai/env";

const EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2";

const createBaseEnv = (): NodeJS.ProcessEnv => ({
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:password@localhost:5432/zoms",
  DIRECT_URL: "postgresql://user:password@localhost:5432/zoms_direct",
  OPENROUTER_API_KEY: "openrouter-key",
  OPENROUTER_CHAT_MODEL: "openai/gpt-4.1-mini",
  OPENROUTER_EMBEDDING_MODEL: EMBEDDING_MODEL,
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

  it("throws when database env vars are missing", () => {
    const env = createBaseEnv();
    delete env.DATABASE_URL;
    delete env.DIRECT_URL;

    expect(() => parseAiEnv(env)).toThrow(/DATABASE_URL|DIRECT_URL/i);
  });

  it("throws when upstash redis env vars are missing", () => {
    const env = createBaseEnv();
    delete env.UPSTASH_REDIS_REST_TOKEN;

    expect(() => parseAiEnv(env)).toThrow(/UPSTASH_REDIS_REST_TOKEN/i);
  });

  it("throws when embedding model is missing", () => {
    const env = createBaseEnv();
    delete env.OPENROUTER_EMBEDDING_MODEL;

    expect(() => parseAiEnv(env)).toThrow(/OPENROUTER_EMBEDDING_MODEL/i);
  });

  it("returns chat, database, redis, embedding, and auth config when env vars are valid", () => {
    const config = createAiConfig(createBaseEnv());

    expect(config.openRouter.chatModel).toBe("openai/gpt-4.1-mini");
    expect(config.openRouter.embeddingModel).toBe(EMBEDDING_MODEL);
    expect(config.database.directUrl).toBe("postgresql://user:password@localhost:5432/zoms_direct");
    expect(config.auth.reindexSecret).toBe("reindex-secret");
  });
});
