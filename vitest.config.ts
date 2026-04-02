import path from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const serverOnlyMockPath = path.join(currentDirectory, "tests/vitest/mocks/server-only.ts");

export default defineConfig({
  resolve: {
    alias: {
      "server-only": serverOnlyMockPath
    }
  },
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/vitest/**/*.test.ts", "tests/vitest/**/*.test.tsx"],
    coverage: {
      provider: "v8"
    }
  }
});
