import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('AI reindex CLI', () => {
  it('does not import server-only in the standalone node entrypoint', () => {
    const source = readFileSync('src/lib/ingestion/cli.ts', 'utf8');

    expect(source).not.toContain("import 'server-only';");
    expect(source).toContain("from 'dotenv'");
    expect(source).toContain("loadEnv({ path: '.env.local'");
  });

  it('routes prisma and reindex production wrappers through the shared script helper', () => {
    const helperSource = readFileSync('scripts/_helpers.ts', 'utf8');
    const prismaGenerateSource = readFileSync('scripts/prisma-generate-prod.ts', 'utf8');
    const prismaMigrateSource = readFileSync('scripts/prisma-migrate-prod.ts', 'utf8');
    const reindexSource = readFileSync('scripts/ai-reindex-prod.ts', 'utf8');

    expect(helperSource).toContain('loadEnv({ path, override: false, quiet: true })');
    expect(prismaGenerateSource).toContain("from './_helpers'");
    expect(prismaGenerateSource).toContain("loadScriptEnv('.env.production.local')");
    expect(prismaMigrateSource).toContain("from './_helpers'");
    expect(prismaMigrateSource).toContain("loadScriptEnv('.env.production.local')");
    expect(reindexSource).toContain("from './_helpers'");
    expect(reindexSource).toContain("loadScriptEnv('.env.production.local')");
  });

  it('defines a local reset script that resets prisma, redis, vector, then reindexes', () => {
    const source = readFileSync('scripts/ai-reset.ts', 'utf8');

    expect(source).toContain("loadScriptEnv('.env.local')");
    expect(source).toContain("prisma', 'migrate', 'reset', '--force'");
    expect(source).toContain('redis.flushdb()');
    expect(source).toContain('vectorIndex.reset({ all: true })');
    expect(source).toContain("tsx', 'src/lib/ingestion/cli.ts");
  });
});
