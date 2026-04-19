import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Redis } from "@upstash/redis";
import { Pool } from "pg";
import Supermemory from "supermemory";

import { PrismaClient } from "@/generated/prisma/client";

import { parseAiEnv } from "../src/lib/ai/env";
import { createScriptEnv, loadScriptEnv, requireDatabaseEnv, runPnpm } from "./_helpers";

async function confirmReset(): Promise<boolean> {
  const prompt = [
    "This will permanently reset the local assistant data sources:",
    "- Prisma database via `prisma migrate reset --force`",
    "- Upstash Redis via `flushdb()`",
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

async function getExistingSessionKeys(databaseUrl: string): Promise<string[]> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const existingSessionKeys = await prisma.chatSession.findMany({
      select: {
        sessionKey: true
      }
    });

    return existingSessionKeys.map(({ sessionKey }) => sessionKey);
  } finally {
    await prisma.$disconnect();
    await pool.end();
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

  const existingSessionKeys = await getExistingSessionKeys(env.DATABASE_URL);
  const prismaResetResult = runPnpm(["exec", "prisma", "migrate", "reset", "--force"], {
    env,
    stdio: "inherit"
  });

  if (prismaResetResult.status !== 0) {
    process.exit(prismaResetResult.status ?? 1);
  }

  console.log("Clearing Upstash Redis...");
  const redis = new Redis({
    token: aiEnv.UPSTASH_REDIS_REST_TOKEN,
    url: aiEnv.UPSTASH_REDIS_REST_URL
  });
  await redis.flushdb();
  console.log("Upstash Redis cleared.");

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
