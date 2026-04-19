import "server-only";

import { type AiEnv, getAiEnv, parseAiEnv } from "./env";

export interface AiConfig {
  auth: {
    reindexSecret: string;
  };
  database: {
    directUrl: string;
    url: string;
  };
  openRouter: {
    apiKey: string;
    chatModel: string;
    embeddingModel: string;
  };
  redis: {
    token: string;
    url: string;
  };
  siteUrl?: string;
}

function toConfig(env: AiEnv): AiConfig {
  return {
    auth: {
      reindexSecret: env.AI_REINDEX_SECRET
    },
    database: {
      directUrl: env.DIRECT_URL,
      url: env.DATABASE_URL
    },
    openRouter: {
      apiKey: env.OPENROUTER_API_KEY,
      chatModel: env.OPENROUTER_CHAT_MODEL,
      embeddingModel: env.OPENROUTER_EMBEDDING_MODEL
    },
    redis: {
      token: env.UPSTASH_REDIS_REST_TOKEN,
      url: env.UPSTASH_REDIS_REST_URL
    },
    siteUrl: env.NEXT_PUBLIC_SITE_URL
  };
}

export function createAiConfig(env: NodeJS.ProcessEnv): AiConfig {
  return toConfig(parseAiEnv(env));
}

let cachedConfig: AiConfig | undefined;

export function getAiConfig(): AiConfig {
  cachedConfig ??= toConfig(getAiEnv());
  return cachedConfig;
}
