import { config as loadEnv } from 'dotenv';

import { runSiteReindex } from './reindex';

loadEnv({ path: '.env.local', override: false, quiet: true });
loadEnv({ quiet: true });

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const documentIdIndex = args.findIndex((arg) => arg === '--document');
  const documentId =
    documentIdIndex >= 0 && documentIdIndex + 1 < args.length
      ? args[documentIdIndex + 1]
      : undefined;
  const result = await runSiteReindex({ documentId });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
