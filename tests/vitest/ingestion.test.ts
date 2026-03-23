import { describe, expect, it, vi } from 'vitest';

import { loadAboutDocuments } from '@/lib/content/about';
import { normalizeBlogPostRecord } from '@/lib/content/blog';
import {
  getExperienceDocumentId,
  getLegacyExperienceDocumentId,
  loadExperienceDocuments,
  normalizeExperienceRecord
} from '@/lib/content/experience';
import { normalizeProjectRecord } from '@/lib/content/projects';
import { chunkDocument } from '@/lib/ingestion/chunk';
import { createChunkId, createDocumentHash } from '@/lib/ingestion/hash';
import { reindexDocuments } from '@/lib/ingestion/reindex';

describe('content normalization and ingestion', () => {
  it('normalizes blog posts from source records', () => {
    const document = normalizeBlogPostRecord({
      _id: 'blog_1',
      title: 'Building a grounded assistant',
      slug: { current: 'grounded-assistant' },
      summary: 'A walkthrough of deterministic RAG on a portfolio site.',
      body: [
        '# Why grounding matters',
        '',
        'Reliable answers start with explicit citations.',
        '',
        '```ts',
        'const heading = "## keep this inside code";',
        '```',
        '',
        '## Retrieval',
        '',
        'Rank chunks by title, tags, and page context.'
      ].join('\n'),
      publishedAt: '2026-03-20T00:00:00.000Z',
      tags: ['AI', 'RAG']
    });

    expect(document.documentId).toBe('blog:grounded-assistant');
    expect(document.contentType).toBe('blog');
    expect(document.url).toBe('/blog/grounded-assistant');
    expect(document.sections.map((section) => section.title)).toEqual([
      'Summary',
      'Why grounding matters',
      'Retrieval'
    ]);
    expect(document.plainText).toContain('Reliable answers start with explicit citations.');
  });

  it('normalizes project records from constants', () => {
    const document = normalizeProjectRecord({
      name: 'Batibot',
      alt: 'Batibot screenshots',
      image: 'project-batibot.jpg',
      info: 'Batibot is an AI-powered messaging companion.',
      techs: ['React Native CLI', 'Typescript', 'Supabase'],
      links: {
        demo: 'https://example.com/demo',
        github: 'https://example.com/repo'
      }
    });

    expect(document.documentId).toBe('project:batibot');
    expect(document.url).toBe('/#projects');
    expect(document.sections.map((section) => section.id)).toEqual(['overview', 'stack', 'links']);
    expect(document.sections[1]?.content).toContain('React Native CLI');
    expect(document.sections[2]?.content).toContain('https://example.com/demo');
  });

  it('normalizes local about content without inlining experience documents into the about index', async () => {
    const documents = await loadAboutDocuments();
    const aboutDocument = documents.at(0);

    expect(documents).toHaveLength(1);
    expect(aboutDocument?.documentId).toBe('about:profile');
    expect(aboutDocument?.sections.map((section) => section.id)).toEqual([
      'intro',
      'skills',
      'experience'
    ]);
    expect(aboutDocument?.plainText).toContain('Software Engineer based in the Philippines');
  });

  it('normalizes experience content into dedicated experience documents', async () => {
    const documents = await loadExperienceDocuments();
    const experiencePlainText = documents.map((document) => document.plainText).join('\n');

    expect(documents.length).toBeGreaterThan(0);
    expect(documents.every((document) => document.contentType === 'experience')).toBe(true);
    expect(
      documents.every((document) => /^experience:[a-z0-9-]+:[a-z0-9-]+$/.test(document.documentId))
    ).toBe(true);
    expect(experiencePlainText).toContain('Seansoft Corporation');
    expect(experiencePlainText).toContain('Makati City, Philippines (Remote)');
    expect(experiencePlainText).toContain('Prisma');
  });

  it('uses stable current and legacy experience document ids for migration-safe reindexing', () => {
    const document = normalizeExperienceRecord({
      company: 'Evelan GmbH',
      companyWebsite: 'https://example.com',
      duties: [],
      location: 'Hamburg, Germany (Remote)',
      order: 1,
      range: 'Aug 2023 – Dec 2023',
      title: 'Full Stack Web Developer'
    });

    expect(document.documentId).toBe(
      getExperienceDocumentId('Full Stack Web Developer', 'Evelan GmbH')
    );
    expect(document.documentId).toBe('experience:full-stack-web-developer:evelan-gmbh');
    expect(getLegacyExperienceDocumentId('Full Stack Web Developer', 'Evelan GmbH')).toBe(
      'about:experience:evelan-gmbh-full-stack-web-developer'
    );
  });

  it('splits sections before generic chunking and preserves code fences', async () => {
    const document = normalizeBlogPostRecord({
      _id: 'blog_2',
      title: 'Chunk boundaries',
      slug: { current: 'chunk-boundaries' },
      summary: 'Summary section first.',
      body: [
        '# Heading One',
        '',
        'Paragraph line one.',
        'Paragraph line two.',
        '',
        '```ts',
        'const sample = "## do not split";',
        'console.log(sample);',
        '```',
        '',
        '## Heading Two',
        '',
        'Another paragraph here.'
      ].join('\n'),
      publishedAt: '2026-03-19T00:00:00.000Z',
      tags: ['Testing']
    });

    const chunks = await chunkDocument(document, {
      chunkOverlap: 20,
      chunkSize: 120
    });

    expect(chunks[0]?.sectionId).toBe('summary');
    expect(
      chunks.some((chunk) => chunk.content.includes('const sample = "## do not split";'))
    ).toBe(true);
    expect(chunks.some((chunk) => chunk.sectionTitle === 'Heading Two')).toBe(true);
  });

  it('creates stable document hashes and chunk ids', async () => {
    const document = normalizeProjectRecord({
      name: 'Stable IDs',
      alt: 'Stable IDs screenshot',
      image: 'stable.jpg',
      info: 'A deterministic document.',
      techs: ['Next.js'],
      links: {
        demo: 'https://example.com/demo',
        github: 'https://example.com/repo'
      }
    });

    const firstHash = createDocumentHash(document);
    const secondHash = createDocumentHash(document);
    const chunks = await chunkDocument(document, {
      chunkOverlap: 10,
      chunkSize: 120
    });

    expect(firstHash).toBe(secondHash);
    expect(createChunkId(document.documentId, chunks[0].sectionId, 0, chunks[0].content)).toBe(
      chunks[0].id
    );
  });

  it('skips unchanged documents and replaces stale vectors for changed documents', async () => {
    const unchanged = normalizeProjectRecord({
      name: 'No Changes',
      alt: 'No changes',
      image: 'no-changes.jpg',
      info: 'This document should be skipped.',
      techs: ['Next.js'],
      links: {
        demo: 'https://example.com/no-changes',
        github: 'https://example.com/no-changes-repo'
      }
    });

    const changed = normalizeProjectRecord({
      name: 'Changed Project',
      alt: 'Changed project',
      image: 'changed.jpg',
      info: 'This document should trigger delete and upsert.',
      techs: ['Next.js', 'Prisma'],
      links: {
        demo: 'https://example.com/changed',
        github: 'https://example.com/changed-repo'
      }
    });

    const vectorClient = {
      deleteByPrefix: vi.fn(async () => undefined),
      query: vi.fn(async () => []),
      upsert: vi.fn(async () => undefined)
    };
    const indexedDocumentStore = {
      getByDocumentId: vi.fn(async (documentId: string) => {
        if (documentId === unchanged.documentId) {
          return {
            contentHash: createDocumentHash(unchanged)
          };
        }

        if (documentId === changed.documentId) {
          return {
            contentHash: 'outdated-hash'
          };
        }

        return null;
      }),
      upsert: vi.fn(async () => undefined)
    };

    const result = await reindexDocuments({
      documents: [unchanged, changed],
      indexedDocumentStore,
      vectorClient
    });

    expect(result.skipped).toBe(1);
    expect(result.updated).toBe(1);
    expect(vectorClient.deleteByPrefix).toHaveBeenCalledWith('doc:project:changed-project:');
    expect(vectorClient.upsert).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vectorClient.upsert.mock.calls)).toContain(
      'This document should trigger delete and upsert.'
    );
    expect(indexedDocumentStore.upsert).toHaveBeenCalledTimes(1);
  });
});
