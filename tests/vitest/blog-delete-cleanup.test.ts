import { beforeEach, describe, expect, it, vi } from 'vitest';

const deleteByPrefix = vi.fn();
const repositories = {
  deleteIndexedDocument: vi.fn()
};
const log = {
  error: vi.fn(),
  info: vi.fn()
};

vi.mock('@/lib/vector/index', () => ({
  getVectorIndexClient: () => ({
    deleteByPrefix
  })
}));

vi.mock('@/lib/db/repositories', () => ({
  repositories
}));

vi.mock('@/lib/logger', () => ({
  default: log
}));

describe('blog delete cleanup scheduling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defers deleted blog cleanup until after the response completes', async () => {
    let scheduledCallback: () => void | Promise<void> = () => {
      throw new Error('Expected scheduleDeletedBlogCleanup to register a callback.');
    };
    const { scheduleDeletedBlogCleanup } = await import('@/lib/blogDeleteCleanup');

    scheduleDeletedBlogCleanup('generated-blog-post', (callback) => {
      scheduledCallback = callback;
    });

    expect(deleteByPrefix).not.toHaveBeenCalled();
    expect(repositories.deleteIndexedDocument).not.toHaveBeenCalled();

    await scheduledCallback();

    expect(deleteByPrefix).toHaveBeenCalledWith('doc:blog:generated-blog-post:');
    expect(repositories.deleteIndexedDocument).toHaveBeenCalledWith('blog:generated-blog-post');
    expect(log.info).toHaveBeenCalledWith('Deleted blog cleanup completed after removal', {
      documentId: 'blog:generated-blog-post',
      slug: 'generated-blog-post'
    });
  });

  it('logs cleanup failures instead of throwing', async () => {
    let scheduledCallback: () => void | Promise<void> = () => {
      throw new Error('Expected scheduleDeletedBlogCleanup to register a callback.');
    };
    deleteByPrefix.mockRejectedValueOnce(new Error('Upstash unavailable'));
    const { scheduleDeletedBlogCleanup } = await import('@/lib/blogDeleteCleanup');

    scheduleDeletedBlogCleanup('generated-blog-post', (callback) => {
      scheduledCallback = callback;
    });

    await expect(scheduledCallback()).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalledWith('Deleted blog cleanup failed after removal', {
      documentId: 'blog:generated-blog-post',
      error: 'Upstash unavailable',
      slug: 'generated-blog-post'
    });
  });
});
