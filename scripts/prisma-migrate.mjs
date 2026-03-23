import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', override: false, quiet: true });
loadEnv({ quiet: true });

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  throw new Error(
    'DATABASE_URL and DIRECT_URL environment variables must be set to run this script. Please create a .env.local file with these variables or set them in your environment.'
  );
}

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL
};

const hasRealDatabaseUrls = Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);

if (hasRealDatabaseUrls) {
  const result = spawnSync(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['exec', 'prisma', 'migrate', 'dev', '--name', 'init_ai_assistant'],
    {
      env,
      stdio: 'inherit',
      shell: false
    }
  );

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

const timestamp = new Date()
  .toISOString()
  .replaceAll(/[-:TZ.]/g, '')
  .slice(0, 14);
const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
const migrationDir = join(migrationsDir, `${timestamp}_init_ai_assistant`);
const migrationPath = join(migrationDir, 'migration.sql');
const lockPath = join(migrationsDir, 'migration_lock.toml');

mkdirSync(migrationDir, { recursive: true });
mkdirSync(migrationsDir, { recursive: true });
writeFileSync(lockPath, 'provider = "postgresql"\n');

const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  [
    'exec',
    'prisma',
    'migrate',
    'diff',
    '--from-empty',
    '--to-schema',
    'prisma/schema.prisma',
    '--script'
  ],
  {
    env,
    encoding: 'utf8',
    shell: false
  }
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  process.exit(result.status);
}

writeFileSync(migrationPath, result.stdout);
process.stdout.write(`Generated migration at ${migrationPath}\n`);
