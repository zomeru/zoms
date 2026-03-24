import { createScriptEnv, loadScriptEnv, runPnpm } from './_helpers';

loadScriptEnv('.env.production.local');
const env = createScriptEnv();
const result = runPnpm(['exec', 'tsx', 'src/lib/ingestion/cli.ts', ...process.argv.slice(2)], {
  env,
  stdio: 'inherit'
});

process.exit(result.status ?? 1);
