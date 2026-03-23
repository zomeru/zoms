import { spawnSync } from 'node:child_process';
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

const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'prisma', 'generate'],
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
