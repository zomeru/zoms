import { seedProjects } from "@/lib/sanity-project-seed";

import { loadScriptEnv } from "./_helpers";

async function main() {
  loadScriptEnv(".env.local");
  const result = await seedProjects();

  process.stdout.write(`Upserted ${result.count} Sanity project documents.\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
