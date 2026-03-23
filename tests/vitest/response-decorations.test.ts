import { describe, expect, it } from 'vitest';

import { filterResponseDecorations } from '@/lib/ai/responseDecorations';
import type { Citation, RelatedContentItem } from '@/lib/ai/schemas';
import { classifyQueryIntent } from '@/lib/retrieval/classify';

const citations: Citation[] = [
  {
    contentType: 'about',
    id: 'about-1',
    sectionTitle: 'Profile',
    snippet: 'About Zomer',
    title: 'About',
    url: '/#about'
  },
  {
    contentType: 'blog',
    id: 'blog-1',
    sectionTitle: 'Summary',
    snippet: 'A blog post',
    title: 'A Blog',
    url: '/blog/a-blog'
  }
];

const relatedContent: RelatedContentItem[] = [
  {
    contentType: 'about',
    reason: 'About match',
    title: 'About',
    url: '/#about'
  },
  {
    contentType: 'blog',
    reason: 'Blog match',
    title: 'A Blog',
    url: '/blog/a-blog'
  }
];

describe('response decoration filtering', () => {
  it('suppresses citations and related content for assistant identity questions', () => {
    expect(
      filterResponseDecorations({
        citations,
        classification: classifyQueryIntent('Who are you?'),
        query: 'Who are you?',
        relatedContent
      })
    ).toEqual({
      citations: [],
      relatedContent: []
    });
  });

  it('keeps only blog decorations for blog questions', () => {
    expect(
      filterResponseDecorations({
        citations,
        classification: classifyQueryIntent('What is the latest blog?'),
        query: 'What is the latest blog?',
        relatedContent
      })
    ).toEqual({
      citations: [citations[1]],
      relatedContent: [relatedContent[1]]
    });
  });

  it('keeps general knowledge questions undecorated when there is no related blog content', () => {
    expect(
      filterResponseDecorations({
        citations: [citations[0]],
        classification: classifyQueryIntent('Who is the president of the US?'),
        query: 'Who is the president of the US?',
        relatedContent: [relatedContent[0]]
      })
    ).toEqual({
      citations: [],
      relatedContent: []
    });
  });

  it('allows blog decorations for general knowledge questions when the answer is connected to a blog post', () => {
    expect(
      filterResponseDecorations({
        citations,
        classification: classifyQueryIntent('What is PHP programming language?'),
        query: 'What is PHP programming language?',
        relatedContent
      })
    ).toEqual({
      citations: [citations[1]],
      relatedContent: [relatedContent[1]]
    });
  });
});
