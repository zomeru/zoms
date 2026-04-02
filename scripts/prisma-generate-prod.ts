import { loadScriptEnv, requireDatabaseEnv, runPnpm } from "./_helpers";

loadScriptEnv(".env.production.local");
const env = requireDatabaseEnv(".env.production.local");
const result = runPnpm(["exec", "prisma", "generate"], {
  env,
  stdio: "inherit"
});

process.exit(result.status ?? 1);
