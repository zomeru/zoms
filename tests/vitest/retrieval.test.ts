import { describe, expect, it, vi } from 'vitest';

import { buildCitations } from '@/lib/retrieval/citations';
import { classifyQueryIntent } from '@/lib/retrieval/classify';
import { dedupeRetrievedChunks, limitChunksPerDocument } from '@/lib/retrieval/dedupe';
import { rankRetrievedChunks } from '@/lib/retrieval/rank';
import { retrieveRelevantChunks, shouldRefuseAnswer } from '@/lib/retrieval/search';
import type { RetrievedChunk } from '@/lib/retrieval/types';

const baseChunk = (overrides: Partial<RetrievedChunk>): RetrievedChunk => ({
  content: 'Grounded answer content',
  contentType: 'blog',
  documentId: 'blog:grounded-assistant',
  id: overrides.id ?? 'chunk-1',
  publishedAt: '2026-03-20T00:00:00.000Z',
  score: 0.45,
  sectionId: 'summary',
  sectionTitle: 'Summary',
  slug: 'grounded-assistant',
  tags: ['AI', 'RAG'],
  title: 'Building a grounded assistant',
  url: '/blog/grounded-assistant',
  ...overrides
});

describe('retrieval ranking heuristics', () => {
  it('classifies work-history questions as experience queries', () => {
    expect(classifyQueryIntent('What did Zomer work on at Evelan GmbH?')).toMatchObject({
      intent: 'EXPERIENCE_QUERY',
      preferredContentTypes: ['experience'],
      strictContentTypes: true
    });
  });

  it('classifies plural and lightly misspelled experience queries as experience questions', () => {
    expect(classifyQueryIntent("show me all zomer's experiences")).toMatchObject({
      intent: 'EXPERIENCE_QUERY',
      preferredContentTypes: ['experience'],
      strictContentTypes: true
    });
    expect(classifyQueryIntent("show 3 latest zomer's expereience")).toMatchObject({
      intent: 'EXPERIENCE_QUERY',
      preferredContentTypes: ['experience'],
      strictContentTypes: true
    });
  });

  it('keeps broad framework questions in general knowledge instead of portfolio retrieval', () => {
    expect(
      classifyQueryIntent(
        'Explain each popular javascript frameworks to me. Frontend, backend, and full stack meta frameworks.'
      )
    ).toMatchObject({
      intent: 'GENERAL_KNOWLEDGE_QUERY',
      strictContentTypes: false
    });
  });

  it('boosts exact title, slug, tag, section heading, page hint, and recency matches', () => {
    const matches = rankRetrievedChunks({
      classification: classifyQueryIntent('grounded assistant retrieval ai'),
      currentBlogSlug: 'grounded-assistant',
      matches: [
        baseChunk({
          id: 'chunk-title',
          score: 0.35,
          sectionTitle: 'Retrieval',
          title: 'Grounded assistant'
        }),
        baseChunk({
          id: 'chunk-other',
          documentId: 'project:vector-tools',
          publishedAt: '2023-01-01T00:00:00.000Z',
          score: 0.45,
          slug: 'vector-tools',
          tags: ['Infrastructure'],
          title: 'Vector tools',
          url: '/#projects'
        })
      ],
      query: 'grounded assistant retrieval ai'
    });

    expect(matches[0]?.id).toBe('chunk-title');
    expect(matches[0]?.score).toBeGreaterThan(matches[1]?.score ?? 0);
  });

  it('dedupes repeated chunk ids and enforces per-document caps', () => {
    const deduped = dedupeRetrievedChunks([
      baseChunk({ id: 'duplicate' }),
      baseChunk({ id: 'duplicate', score: 0.3 }),
      baseChunk({ id: 'unique-2', score: 0.44 }),
      baseChunk({ id: 'unique-3', score: 0.43 }),
      baseChunk({ id: 'unique-4', score: 0.42 }),
      baseChunk({
        documentId: 'project:batibot',
        id: 'project-1',
        score: 0.41,
        title: 'Batibot',
        url: '/#projects'
      })
    ]);

    const limited = limitChunksPerDocument(deduped, 2);

    expect(deduped).toHaveLength(5);
    expect(limited.filter((chunk) => chunk.documentId === 'blog:grounded-assistant')).toHaveLength(
      2
    );
  });

  it('returns a no-answer decision when evidence is weak', () => {
    const shouldRefuse = shouldRefuseAnswer(
      [baseChunk({ id: 'weak-1', score: 0.22 }), baseChunk({ id: 'weak-2', score: 0.18 })],
      classifyQueryIntent('What is React?')
    );

    expect(shouldRefuse).toBe(true);
  });

  it('builds citation payloads from ranked chunks', () => {
    const citations = buildCitations([
      baseChunk({
        content: 'Reliable answers start with explicit citations.',
        id: 'citation-1',
        sectionTitle: 'Summary'
      }),
      baseChunk({
        content: 'Rank chunks by title, tags, and page context.',
        id: 'citation-2',
        contentType: 'project',
        documentId: 'project:vector-tools',
        sectionTitle: 'Overview',
        title: 'Vector tools',
        url: '/#projects'
      })
    ]);

    expect(citations[0]).toMatchObject({
      id: 'citation-1',
      sectionTitle: 'Summary',
      snippet: 'Building a grounded assistant',
      url: '/blog/grounded-assistant'
    });
    expect(citations[1]).toMatchObject({
      id: 'citation-2',
      sectionTitle: 'Overview',
      url: '/#projects'
    });
  });

  it('deduplicates blog citations that point to the same post across different sections', () => {
    const citations = buildCitations([
      baseChunk({
        id: 'citation-summary',
        sectionId: 'summary',
        sectionTitle: 'Summary',
        title: 'Building a grounded assistant',
        url: '/blog/grounded-assistant'
      }),
      baseChunk({
        id: 'citation-body',
        sectionId: 'body',
        sectionTitle: 'Body',
        title: 'Building a grounded assistant',
        url: '/blog/grounded-assistant'
      })
    ]);

    expect(citations).toHaveLength(1);
    expect(citations[0]).toMatchObject({
      id: 'citation-summary',
      url: '/blog/grounded-assistant'
    });
  });

  it('queries upstash using raw text instead of a locally generated embedding vector', async () => {
    const vectorQuery = vi.fn(async () => [
      {
        data: 'Reliable answers start with explicit citations.',
        id: 'citation-1',
        metadata: {
          contentType: 'blog',
          documentId: 'blog:grounded-assistant',
          sectionId: 'summary',
          sectionTitle: 'Summary',
          slug: 'grounded-assistant',
          tags: ['AI', 'RAG'],
          title: 'Grounded assistant',
          url: '/blog/grounded-assistant'
        },
        score: 0.6
      },
      {
        data: 'Rank chunks by title, tags, and page context.',
        id: 'citation-2',
        metadata: {
          contentType: 'blog',
          documentId: 'blog:grounded-assistant',
          sectionId: 'retrieval',
          sectionTitle: 'Retrieval',
          slug: 'grounded-assistant',
          tags: ['AI', 'RAG'],
          title: 'Grounded assistant',
          url: '/blog/grounded-assistant'
        },
        score: 0.55
      }
    ]);

    await retrieveRelevantChunks({
      currentBlogSlug: 'grounded-assistant',
      query: 'How does the assistant stay grounded?',
      vectorQuery
    });

    expect(vectorQuery).toHaveBeenCalledWith({
      query: 'How does the assistant stay grounded?',
      topK: 12
    });
  });

  it('prioritizes experience retrieval and filters citations for experience questions', async () => {
    const vectorQuery = vi
      .fn()
      .mockResolvedValueOnce([
        {
          data: 'Worked on PAUL 360, a secure web application for document sharing.',
          id: 'experience-1',
          metadata: {
            contentType: 'experience',
            documentId: 'experience:full-stack-web-developer:evelan-gmbh',
            sectionId: 'responsibilities',
            sectionTitle: 'Responsibilities',
            slug: 'evelan-gmbh',
            tags: ['Evelan GmbH', 'Full Stack Web Developer', 'Prisma'],
            title: 'Full Stack Web Developer at Evelan GmbH',
            url: '/#experience'
          },
          score: 0.62
        },
        {
          data: 'Built an AI-powered creative assistant using PWA and PocketBase.',
          id: 'blog-1',
          metadata: {
            contentType: 'blog',
            documentId: 'blog:creative-assistant',
            sectionId: 'summary',
            sectionTitle: 'Summary',
            slug: 'creative-assistant',
            tags: ['AI', 'PWA'],
            title: 'Creative assistant architecture',
            url: '/blog/creative-assistant'
          },
          score: 0.91
        }
      ])
      .mockResolvedValueOnce([]);

    const classification = classifyQueryIntent('What did Zomer work on at Evelan GmbH?');
    const result = await retrieveRelevantChunks({
      classification,
      query: 'What did Zomer work on at Evelan GmbH?',
      vectorQuery
    });

    expect(vectorQuery).toHaveBeenNthCalledWith(1, {
      filter: "contentType = 'experience'",
      query: 'What did Zomer work on at Evelan GmbH?',
      topK: 12
    });
    expect(result.matches[0]?.contentType).toBe('experience');
    expect(result.citations).toEqual([
      expect.objectContaining({
        contentType: 'experience',
        title: 'Full Stack Web Developer at Evelan GmbH',
        url: '/#experience'
      })
    ]);
  });
});
