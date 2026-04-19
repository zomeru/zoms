import { ZodError, z } from "zod";

const requiredString = (name: string) =>
  z
    .string({
      error: `${name} is required`
    })
    .trim()
    .min(1, `${name} is required`);

const aiEnvSchema = z.object({
  AI_REINDEX_SECRET: requiredString("AI_REINDEX_SECRET"),
  DATABASE_URL: requiredString("DATABASE_URL"),
  DIRECT_URL: requiredString("DIRECT_URL"),
  NEXT_PUBLIC_SITE_URL: z.string().trim().min(1).optional(),
  OPENROUTER_API_KEY: requiredString("OPENROUTER_API_KEY"),
  OPENROUTER_CHAT_MODEL: requiredString("OPENROUTER_CHAT_MODEL"),
  OPENROUTER_EMBEDDING_MODEL: requiredString("OPENROUTER_EMBEDDING_MODEL"),
  SUPERMEMORY_API_KEY: z.string().trim().min(1).optional(),
  UPSTASH_REDIS_REST_TOKEN: requiredString("UPSTASH_REDIS_REST_TOKEN"),
  UPSTASH_REDIS_REST_URL: requiredString("UPSTASH_REDIS_REST_URL")
});

export type AiEnv = z.infer<typeof aiEnvSchema>;

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "environment";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

export function parseAiEnv(env: NodeJS.ProcessEnv): AiEnv {
  try {
    return aiEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid AI environment configuration: ${formatZodError(error)}`, {
        cause: error
      });
    }

    throw error;
  }
}

let cachedEnv: AiEnv | undefined;

export function getAiEnv(): AiEnv {
  cachedEnv ??= parseAiEnv(process.env);
  return cachedEnv;
}

export function getEmbeddingModel(env: AiEnv): string {
  return env.OPENROUTER_EMBEDDING_MODEL;
}
