import { describe, expect, it } from 'vitest';

import { filterChatCitations } from '@/lib/ai/responseDecorations';
import type { Citation } from '@/lib/ai/schemas';
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

describe('chat citation filtering', () => {
  it('suppresses citations for assistant identity questions', () => {
    expect(
      filterChatCitations({
        citations,
        classification: classifyQueryIntent('Who are you?'),
        query: 'Who are you?'
      })
    ).toEqual([]);
  });

  it('keeps only blog citations for blog questions', () => {
    expect(
      filterChatCitations({
        citations,
        classification: classifyQueryIntent('What is the latest blog?'),
        query: 'What is the latest blog?'
      })
    ).toEqual([citations[1]]);
  });

  it('keeps general knowledge questions undecorated when no related blog citation exists', () => {
    expect(
      filterChatCitations({
        citations: [citations[0]],
        classification: classifyQueryIntent('Who is the president of the US?'),
        query: 'Who is the president of the US?'
      })
    ).toEqual([]);
  });

  it('allows blog citations for general knowledge questions when a relevant blog exists', () => {
    expect(
      filterChatCitations({
        citations,
        classification: classifyQueryIntent('What is PHP programming language?'),
        query: 'What is PHP programming language?'
      })
    ).toEqual([citations[1]]);
  });

  it('deduplicates repeated citations before returning them to chat', () => {
    const duplicateBlogCitation: Citation = {
      contentType: 'blog',
      id: 'direct:blog:latest:duplicate-post',
      sectionTitle: 'Summary',
      snippet: 'Duplicate post',
      title: 'Duplicate post',
      url: '/blog/duplicate-post'
    };

    expect(
      filterChatCitations({
        citations: [duplicateBlogCitation, duplicateBlogCitation, duplicateBlogCitation],
        classification: classifyQueryIntent('What is the latest blog?'),
        query: 'What is the latest blog?'
      })
    ).toEqual([duplicateBlogCitation]);
  });

  it('deduplicates equivalent blog citations even when their ids differ', () => {
    expect(
      filterChatCitations({
        citations: [
          {
            contentType: 'blog',
            id: 'direct:blog:latest:duplicate-post:1',
            sectionTitle: 'Summary',
            snippet: 'Duplicate post',
            title: 'Duplicate post',
            url: '/blog/duplicate-post'
          },
          {
            contentType: 'blog',
            id: 'direct:blog:latest:duplicate-post:2',
            sectionTitle: 'Body',
            snippet: 'Duplicate post',
            title: 'Duplicate post',
            url: '/blog/duplicate-post'
          }
        ],
        classification: classifyQueryIntent('What is the latest blog?'),
        query: 'What is the latest blog?'
      })
    ).toEqual([
      {
        contentType: 'blog',
        id: 'direct:blog:latest:duplicate-post:1',
        sectionTitle: 'Summary',
        snippet: 'Duplicate post',
        title: 'Duplicate post',
        url: '/blog/duplicate-post'
      }
    ]);
  });
});
