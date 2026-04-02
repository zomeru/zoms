import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { PrismaClient } from "@prisma/client";
import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";
import Supermemory from "supermemory";

import { parseAiEnv } from "../src/lib/ai/env";
import { createScriptEnv, loadScriptEnv, requireDatabaseEnv, runPnpm } from "./_helpers";

async function confirmReset(): Promise<boolean> {
  const prompt = [
    "This will permanently reset the local assistant data sources:",
    "- Prisma database via `prisma migrate reset --force`",
    "- Upstash Redis via `flushdb()`",
    "- Upstash Vector via `reset({ all: true })`",
    "- Supermemory chat-session memories (when `SUPERMEMORY_API_KEY` is set)",
    "- Then run a full `ai:reindex`",
    "",
    "Continue? [Y/n] "
  ].join("\n");

  const readline = createInterface({ input, output });

  try {
    const answer = (await readline.question(prompt)).trim().toLowerCase();

    return answer === "" || answer === "y" || answer === "yes";
  } finally {
    readline.close();
  }
}

async function getExistingSessionKeys(): Promise<string[]> {
  const prisma = new PrismaClient();

  try {
    const existingSessionKeys = await prisma.chatSession.findMany({
      select: {
        sessionKey: true
      }
    });

    return existingSessionKeys.map(({ sessionKey }) => sessionKey);
  } finally {
    await prisma.$disconnect();
  }
}

async function clearSupermemorySessionMemories(
  sessionKeys: string[],
  apiKey: string | undefined
): Promise<void> {
  if (!apiKey) {
    console.log("Skipping Supermemory reset because SUPERMEMORY_API_KEY is not set.");
    return;
  }

  if (sessionKeys.length === 0) {
    console.log("No chat sessions found. Skipping Supermemory reset.");
    return;
  }

  console.log("Clearing Supermemory chat-session memories...");
  const client = new Supermemory({
    apiKey,
    maxRetries: 0,
    timeout: 5000
  });

  await Promise.all(
    sessionKeys.map(async (sessionKey) => {
      await client.memories.forget({
        containerTag: sessionKey,
        reason: "Local ai:reset"
      });
    })
  );

  console.log("Supermemory chat-session memories cleared.");
}

async function main(): Promise<void> {
  loadScriptEnv(".env.local");
  const env = requireDatabaseEnv(".env.local");
  const aiEnv = parseAiEnv(process.env);

  if (!(await confirmReset())) {
    process.stdout.write("Reset cancelled.\n");
    process.exit(0);
  }

  const existingSessionKeys = await getExistingSessionKeys();
  const prismaResetResult = runPnpm(["exec", "prisma", "migrate", "reset", "--force"], {
    env,
    stdio: "inherit"
  });

  if (prismaResetResult.status !== 0) {
    process.exit(prismaResetResult.status ?? 1);
  }

  console.log("Clearing Upstash Redis and Vector...");
  const redis = new Redis({
    token: aiEnv.UPSTASH_REDIS_REST_TOKEN,
    url: aiEnv.UPSTASH_REDIS_REST_URL
  });
  await redis.flushdb();
  console.log("Upstash Redis cleared.");

  console.log("Resetting Upstash Vector index...");
  const vectorIndex = new Index({
    token: aiEnv.UPSTASH_VECTOR_REST_TOKEN,
    url: aiEnv.UPSTASH_VECTOR_REST_URL
  });
  await vectorIndex.reset({ all: true });
  console.log("Upstash Vector index reset.");

  await clearSupermemorySessionMemories(existingSessionKeys, aiEnv.SUPERMEMORY_API_KEY);

  console.log("Running ai:reindex to rebuild vector index from database...");
  const reindexResult = runPnpm(["exec", "tsx", "src/lib/ingestion/cli.ts"], {
    env: createScriptEnv(),
    stdio: "inherit"
  });

  process.exit(reindexResult.status ?? 1);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
