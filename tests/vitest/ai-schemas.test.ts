import { describe, expect, it } from 'vitest';

import {
  groundedAnswerSchema,
  relatedContentItemSchema,
  transformResultSchema
} from '@/lib/ai/schemas';

describe('AI schemas', () => {
  it('accepts grounded answer payloads with citations and related content', () => {
    const result = groundedAnswerSchema.parse({
      answer: 'The site uses deterministic retrieval with explicit citations.',
      citations: [
        {
          contentType: 'blog',
          id: 'citation-1',
          sectionTitle: 'Summary',
          snippet: 'deterministic retrieval with explicit citations',
          title: 'Building a grounded assistant',
          url: '/blog/grounded-assistant'
        }
      ],
      relatedContent: [
        {
          contentType: 'project',
          reason: 'Relevant project connection',
          title: 'Batibot',
          url: '/#projects'
        }
      ],
      supported: true
    });

    expect(result.supported).toBe(true);
    expect(result.citations).toHaveLength(1);
  });

  it('rejects unsupported related content payloads', () => {
    expect(() =>
      relatedContentItemSchema.parse({
        contentType: 'podcast',
        reason: 'Invalid type',
        title: 'Unsupported',
        url: '/unsupported'
      })
    ).toThrow();
  });

  it('accepts transform payloads for assistant-only blog transforms', () => {
    const result = transformResultSchema.parse({
      bullets: ['Focus on deterministic retrieval', 'Preserve citations'],
      mode: 'tldr',
      title: 'TL;DR',
      transformedText: 'This post explains how the site grounds AI answers in indexed content.'
    });

    expect(result.mode).toBe('tldr');
    expect(result.bullets[0]).toContain('deterministic retrieval');
  });
});
