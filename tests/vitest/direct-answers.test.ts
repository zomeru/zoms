import { beforeEach, describe, expect, it, vi } from 'vitest';

import { classifyQueryIntent } from '@/lib/retrieval/classify';

const getLatestBlogPosts = vi.fn();
const getOldestBlogPosts = vi.fn();
const getExperience = vi.fn();

vi.mock('@/lib/blog', () => ({
  getLatestBlogPosts,
  getOldestBlogPosts
}));

vi.mock('@/lib/experience', () => ({
  getExperience
}));

describe('direct assistant answers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLatestBlogPosts.mockResolvedValue([
      {
        _id: 'blog-1',
        generated: false,
        publishedAt: '2026-03-23T00:00:00.000Z',
        readTime: 8,
        slug: { current: 'node-streams' },
        summary: 'Backpressure, Web Streams, and Node.js 24.x.',
        tags: ['Node.js'],
        title:
          'Optimizing Node.js 24.x Streams: High-Performance Data Processing with Web Streams and Backpressure'
      }
    ]);
    getOldestBlogPosts.mockResolvedValue([
      {
        _id: 'blog-oldest',
        generated: false,
        publishedAt: '2023-01-01T00:00:00.000Z',
        readTime: 8,
        slug: { current: 'first-post' },
        summary: 'The first blog post.',
        tags: ['Career'],
        title: 'My first post'
      }
    ]);
    getExperience.mockResolvedValue([
      {
        company: 'Seansoft Corporation',
        duties: [],
        location: 'Makati City, Philippines (Remote)',
        order: 0,
        range: 'Jan. 2024 - Present',
        title: 'Software Engineer'
      },
      {
        company: 'Freelance',
        duties: [],
        location: 'Bulacan, Philippines (Remote)',
        order: 3,
        range: 'Apr. 2021 - Feb. 2022',
        title: 'Full Stack Developer'
      }
    ]);
  });

  it('answers latest blog queries from the date-sorted blog source of truth', async () => {
    const { getDirectAssistantAnswer } = await import('@/lib/ai/directAnswers');

    const answer = await getDirectAssistantAnswer({
      classification: classifyQueryIntent('What is the latest blog?'),
      query: 'What is the latest blog?'
    });

    expect(answer).not.toBeNull();
    expect(getLatestBlogPosts).toHaveBeenCalledWith(1);
    expect(answer?.citations[0]).toMatchObject({
      contentType: 'blog',
      title:
        'Optimizing Node.js 24.x Streams: High-Performance Data Processing with Web Streams and Backpressure',
      url: '/blog/node-streams'
    });
  });

  it('answers oldest experience queries deterministically from ordered experience entries', async () => {
    const { getDirectAssistantAnswer } = await import('@/lib/ai/directAnswers');

    const answer = await getDirectAssistantAnswer({
      classification: classifyQueryIntent('What is the oldest experience?'),
      query: 'What is the oldest experience?'
    });

    expect(answer).not.toBeNull();
    expect(getExperience).toHaveBeenCalledTimes(1);

    let text = '';
    if (answer) {
      for await (const chunk of answer.textStream) {
        text += chunk;
      }
    }

    expect(text).toContain('Full Stack Developer at Freelance');
    expect(text).toContain('Apr. 2021 - Feb. 2022');
  });

  it('answers latest project queries from the current portfolio ordering', async () => {
    const { getDirectAssistantAnswer } = await import('@/lib/ai/directAnswers');

    const answer = await getDirectAssistantAnswer({
      classification: classifyQueryIntent('What is the latest project?'),
      query: 'What is the latest project?'
    });

    expect(answer).not.toBeNull();
    expect(answer?.citations[0]).toMatchObject({
      contentType: 'project',
      title: 'Batibot',
      url: '/#projects'
    });
  });

  it('answers assistant identity questions directly without citations or related content', async () => {
    const { getDirectAssistantAnswer } = await import('@/lib/ai/directAnswers');

    const answer = await getDirectAssistantAnswer({
      classification: classifyQueryIntent('Who are you?'),
      query: 'Who are you?'
    });

    expect(answer).not.toBeNull();
    expect(answer?.citations).toEqual([]);
    expect(answer?.relatedContent).toEqual([]);

    let text = '';
    if (answer) {
      for await (const chunk of answer.textStream) {
        text += chunk;
      }
    }

    expect(text).toContain("I'm Zomer, a Software Engineer.");
    expect(text).toContain('personal background');
    expect(text).toContain('general question');
  });
});
