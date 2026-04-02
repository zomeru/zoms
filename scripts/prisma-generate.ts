import { loadScriptEnv, requireDatabaseEnv, runPnpm } from "./_helpers";

loadScriptEnv(".env.local");
const env = requireDatabaseEnv(".env.local");
const result = runPnpm(["exec", "prisma", "generate"], {
  env,
  stdio: "inherit"
});

process.exit(result.status ?? 1);
