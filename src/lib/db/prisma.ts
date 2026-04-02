import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

import { getAiEnv } from "@/lib/ai/env";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const env = getAiEnv();
  const adapter = new PrismaNeon({
    connectionString: env.DATABASE_URL
  });

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
