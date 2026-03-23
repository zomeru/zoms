import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { Redis } from '@upstash/redis';
import { Index } from '@upstash/vector';

import { parseAiEnv } from '../src/lib/ai/env';
import { createScriptEnv, loadScriptEnv, requireDatabaseEnv, runPnpm } from './_helpers';

async function confirmReset(): Promise<boolean> {
  const prompt = [
    'This will permanently reset the local assistant data sources:',
    '- Prisma database via `prisma migrate reset --force`',
    '- Upstash Redis via `flushdb()`',
    '- Upstash Vector via `reset({ all: true })`',
    '- Then run a full `ai:reindex`',
    '',
    'Continue? [Y/n] '
  ].join('\n');

  const readline = createInterface({ input, output });

  try {
    const answer = (await readline.question(prompt)).trim().toLowerCase();

    return answer === '' || answer === 'y' || answer === 'yes';
  } finally {
    readline.close();
  }
}

async function main(): Promise<void> {
  loadScriptEnv('.env.local');
  const env = requireDatabaseEnv('.env.local');
  const aiEnv = parseAiEnv(process.env);

  if (!(await confirmReset())) {
    process.stdout.write('Reset cancelled.\n');
    process.exit(0);
  }

  const prismaResetResult = runPnpm(
    ['exec', 'prisma', 'migrate', 'reset', '--force', '--skip-generate'],
    {
      env,
      stdio: 'inherit'
    }
  );

  if (prismaResetResult.status !== 0) {
    process.exit(prismaResetResult.status ?? 1);
  }

  const redis = new Redis({
    token: aiEnv.UPSTASH_REDIS_REST_TOKEN,
    url: aiEnv.UPSTASH_REDIS_REST_URL
  });
  await redis.flushdb();

  const vectorIndex = new Index({
    token: aiEnv.UPSTASH_VECTOR_REST_TOKEN,
    url: aiEnv.UPSTASH_VECTOR_REST_URL
  });
  await vectorIndex.reset({ all: true });

  const reindexResult = runPnpm(['exec', 'tsx', 'src/lib/ingestion/cli.ts'], {
    env: createScriptEnv(),
    stdio: 'inherit'
  });

  process.exit(reindexResult.status ?? 1);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
