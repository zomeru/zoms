import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('AI reindex CLI', () => {
  it('does not import server-only in the standalone node entrypoint', () => {
    const source = readFileSync('src/lib/ingestion/cli.ts', 'utf8');

    expect(source).not.toContain("import 'server-only';");
    expect(source).toContain("from 'dotenv'");
    expect(source).toContain("loadEnv({ path: '.env.local'");
  });
});
