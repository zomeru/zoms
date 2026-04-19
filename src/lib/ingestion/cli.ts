import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ quiet: true });

// CLI uses DIRECT_URL — bulk writes + long-lived connections work better without the pooler.
process.env.PRISMA_USE_DIRECT_URL = "1";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const documentIdIndex = args.indexOf("--document");
  const documentId =
    documentIdIndex >= 0 && documentIdIndex + 1 < args.length
      ? args[documentIdIndex + 1]
      : undefined;
  const { getPrismaClient } = await import("@/lib/db/prisma");
  const { withDbRetry } = await import("@/lib/db/retry");

  await withDbRetry(() => getPrismaClient().$queryRawUnsafe<unknown[]>("SELECT 1"), {
    attempts: 10,
    baseDelayMs: 2000,
    maxDelayMs: 30_000,
    label: "db ping"
  });
  console.log("[cli] db connectivity ok");

  const { runSiteReindex } = await import("./reindex");
  const result = await runSiteReindex({ documentId });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
