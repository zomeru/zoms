import { createScriptEnv, loadScriptEnv, runPnpm } from "./_helpers";

loadScriptEnv(".env.local");
const env = createScriptEnv();
const result = runPnpm(["exec", "prisma", "generate"], {
  env,
  stdio: "inherit"
});

process.exit(result.status ?? 1);
