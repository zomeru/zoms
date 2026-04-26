import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

import { getAiEnv } from "@/lib/ai/env";
import log from "@/lib/logger";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const env = getAiEnv();
  const useDirect = process.env.PRISMA_USE_DIRECT_URL === "1";
  const connectionString = useDirect ? env.DIRECT_URL : env.DATABASE_URL;

  if (process.env.PRISMA_LOG_CONNECT === "1") {
    try {
      const url = new URL(connectionString);
      log.info(
        `[prisma] connecting via ${useDirect ? "DIRECT_URL" : "DATABASE_URL"} → ${url.host}`
      );
    } catch {
      // Non-fatal; continue
    }
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: useDirect ? 3 : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000
  });
  pool.on("error", (err) => {
    log.warn("[prisma pool] idle client error", { error: err.message });
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });
}

let prismaLocal: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal;
  }

  if (prismaLocal) {
    return prismaLocal;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = client;
  }

  prismaLocal = client;
  return client;
}
