import { runPnpm } from "./_helpers";

const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== "--runInBand");
const result = runPnpm(["exec", "vitest", "run", ...forwardedArgs], {
  stdio: "inherit"
});

process.exit(result.status ?? 1);
