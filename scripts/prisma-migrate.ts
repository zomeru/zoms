import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadScriptEnv, requireDatabaseEnv, runPnpm, runPnpmText } from "./_helpers";

loadScriptEnv(".env.local");
const env = requireDatabaseEnv(".env.local");

const hasRealDatabaseUrls = Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);

if (hasRealDatabaseUrls) {
  const result = runPnpm(["exec", "prisma", "migrate", "dev", "--name", "init_ai_assistant"], {
    env,
    stdio: "inherit"
  });

  process.exit(result.status ?? 1);
}

const timestamp = new Date()
  .toISOString()
  .replaceAll(/[-:TZ.]/g, "")
  .slice(0, 14);
const migrationsDir = join(process.cwd(), "prisma", "migrations");
const migrationDir = join(migrationsDir, `${timestamp}_init_ai_assistant`);
const migrationPath = join(migrationDir, "migration.sql");
const lockPath = join(migrationsDir, "migration_lock.toml");

mkdirSync(migrationDir, { recursive: true });
mkdirSync(migrationsDir, { recursive: true });
writeFileSync(lockPath, 'provider = "postgresql"\n');

const result = runPnpmText(
  [
    "exec",
    "prisma",
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema",
    "prisma/schema.prisma",
    "--script"
  ],
  {
    env,
    encoding: "utf8"
  }
);

if (result.status !== 0) {
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);

  process.exit(result.status);
}

writeFileSync(migrationPath, result.stdout);
process.stdout.write(`Generated migration at ${migrationPath}\n`);
