import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'server-only': '/Users/zomeru/Desktop/zoms/tests/vitest/mocks/server-only.ts'
    }
  },
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/vitest/**/*.test.ts', 'tests/vitest/**/*.test.tsx'],
    coverage: {
      provider: 'v8'
    }
  }
});
