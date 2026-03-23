import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rateLimitMiddleware = vi.fn();
const getBlogPostBySlug = vi.fn();
const sanityDelete = vi.fn();
const createSanityClient = vi.fn();
const scheduleDeletedBlogCleanup = vi.fn();
const revalidatePath = vi.fn();
const log = {
  error: vi.fn(),
  request: vi.fn(),
  response: vi.fn(),
  timeAsync: vi.fn(async <T>(_label: string, fn: () => Promise<T>) => await fn()),
  warn: vi.fn()
};

vi.mock('@/lib/rateLimit', () => ({
  rateLimitMiddleware
}));

vi.mock('@/lib/blog', () => ({
  getBlogPostBySlug
}));

vi.mock('@sanity/client', () => ({
  createClient: createSanityClient
}));

vi.mock('@/lib/blogDeleteCleanup', () => ({
  scheduleDeletedBlogCleanup
}));

vi.mock('next/cache', () => ({
  revalidatePath
}));

vi.mock('@/lib/logger', () => ({
  default: log
}));

describe('blog delete route', () => {
  beforeEach(() => {
    rateLimitMiddleware.mockResolvedValue(null);
    getBlogPostBySlug.mockResolvedValue({
      _id: 'sanity-post-id',
      body: '# Post body',
      publishedAt: '2026-03-23T00:00:00.000Z',
      slug: { current: 'generated-blog-post' },
      summary: 'Generated summary',
      title: 'Generated Blog Post'
    });
    sanityDelete.mockResolvedValue({ _id: 'sanity-post-id' });
    createSanityClient.mockReturnValue({
      delete: sanityDelete
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

  it('deletes the Sanity post, schedules index cleanup, and revalidates blog surfaces', async () => {
    const { DELETE } = await import('@/app/api/blog/[slug]/route');

    const response = await DELETE(
      new NextRequest('http://localhost/api/blog/generated-blog-post', {
        headers: {
          authorization: 'Bearer cron-secret'
        },
        method: 'DELETE'
      }),
      {
        params: Promise.resolve({ slug: 'generated-blog-post' })
      }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      deleted: {
        slug: 'generated-blog-post',
        title: 'Generated Blog Post'
      },
      success: true
    });
    expect(sanityDelete).toHaveBeenCalledWith('sanity-post-id');
    expect(scheduleDeletedBlogCleanup).toHaveBeenCalledWith('generated-blog-post');
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/blog');
    expect(revalidatePath).toHaveBeenCalledWith('/blog/generated-blog-post');
  });
});
