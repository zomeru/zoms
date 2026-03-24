import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const schemaPath = join(repoRoot, 'prisma', 'schema.prisma');

function readSchema(): string {
  expect(existsSync(schemaPath)).toBe(true);
  return readFileSync(schemaPath, 'utf8');
}

describe('Prisma AI assistant schema', () => {
  it('defines the expected relational models', () => {
    const schema = readSchema();

    for (const modelName of [
      'ChatSession',
      'ChatMessage',
      'RetrievalEvent',
      'IngestionRun',
      'IndexedDocument'
    ]) {
      expect(schema).toMatch(new RegExp(`model\\s+${modelName}\\s+\\{`));
    }

    for (const removedModelName of ['AnswerFeedback', 'CitationClick', 'NoResultEvent']) {
      expect(schema).not.toMatch(new RegExp(`model\\s+${removedModelName}\\s+\\{`));
    }
  });

  it('defines the core chat and ingestion relations', () => {
    const schema = readSchema();

    expect(schema).toMatch(/messages\s+ChatMessage\[\]/);
    expect(schema).toMatch(/session\s+ChatSession/);
    expect(schema).toMatch(/indexedDocuments\s+IndexedDocument\[\]/);
    expect(schema).toMatch(/ingestionRun\s+IngestionRun\?/);
    expect(schema).not.toMatch(/feedbackEvents\s+/);
    expect(schema).not.toMatch(/citationClicks\s+/);
    expect(schema).not.toMatch(/noResultEvents\s+/);
  });

  it('keeps IndexedDocument unique by documentId, not by shared page url', () => {
    const schema = readSchema();

    expect(schema).toMatch(/documentId\s+String\s+@unique/);
    expect(schema).not.toMatch(/url\s+String\s+@unique/);
  });
});
