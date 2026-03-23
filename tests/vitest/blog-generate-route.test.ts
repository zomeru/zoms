import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rateLimitMiddleware = vi.fn();
const generateBlogContent = vi.fn();
const sanityCreate = vi.fn();
const createSanityClient = vi.fn();
const scheduleBlogReindex = vi.fn();
const log = {
  error: vi.fn(),
  info: vi.fn(),
  request: vi.fn(),
  response: vi.fn(),
  timeAsync: vi.fn(async <T>(_label: string, fn: () => Promise<T>) => await fn()),
  warn: vi.fn()
};

vi.mock('@/lib/rateLimit', () => ({
  rateLimitMiddleware
}));

vi.mock('@/lib/generateBlog', () => ({
  generateBlogContent
}));

vi.mock('@sanity/client', () => ({
  createClient: createSanityClient
}));

vi.mock('@/lib/blogReindex', () => ({
  scheduleBlogReindex
}));

vi.mock('@/lib/logger', () => ({
  default: log
}));

describe('blog generation route', () => {
  beforeEach(() => {
    rateLimitMiddleware.mockResolvedValue(null);
    generateBlogContent.mockResolvedValue({
      body: '# Post body',
      readTime: 5,
      summary: 'Generated summary',
      tags: ['AI', 'Next.js'],
      title: 'Generated Blog Post'
    });
    sanityCreate.mockResolvedValue({
      _id: 'sanity-post-id',
      generated: true,
      publishedAt: '2026-03-23T00:00:00.000Z',
      readTime: 5,
      slug: { current: 'generated-blog-post' },
      tags: ['AI', 'Next.js'],
      title: 'Generated Blog Post'
    });
    createSanityClient.mockReturnValue({
      create: sanityCreate
    });
    process.env.CRON_SECRET = 'cron-secret';
    process.env.SANITY_API_TOKEN = 'sanity-token';
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'project-id';
    process.env.NEXT_PUBLIC_SANITY_DATASET = 'dataset';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.SANITY_API_TOKEN;
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_SANITY_DATASET;
  });

  it('schedules a targeted blog reindex after blog generation without changing the success response', async () => {
    const { POST } = await import('@/app/api/blog/generate/route');

    const response = await POST(
      new NextRequest('http://localhost/api/blog/generate', {
        body: JSON.stringify({ aiGenerated: true }),
        headers: {
          authorization: 'Bearer cron-secret'
        },
        method: 'POST'
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      post: {
        slug: {
          current: 'generated-blog-post'
        },
        title: 'Generated Blog Post'
      },
      success: true
    });
    expect(scheduleBlogReindex).toHaveBeenCalledWith('generated-blog-post');
  });
});
