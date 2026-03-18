'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { TechBadge } from '@/components/ui';
import { BLOG_POSTS_PAGE_SIZE } from '@/constants';
import type { BlogPostListItem } from '@/lib/blog';
import { formatDate } from '@/lib/utils';

interface BlogListClientProps {
  initialPosts: BlogPostListItem[];
  initialTotal: number;
}

const BlogListClient: React.FC<BlogListClientProps> = ({ initialPosts, initialTotal }) => {
  const [posts, setPosts] = useState<BlogPostListItem[]>(initialPosts);
  const [offset, setOffset] = useState<number>(initialPosts.length);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef<boolean>(false);

  const hasMore = offset < initialTotal;

  const loadMore = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blog?limit=${BLOG_POSTS_PAGE_SIZE}&offset=${offset}`);

      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response is validated by backend
      const data = (await response.json()) as {
        posts: BlogPostListItem[];
        pagination: { limit: number; offset: number; total: number; hasMore: boolean };
      };

      setPosts((prevPosts) => [...prevPosts, ...data.posts]);
      setOffset((prevOffset) => prevOffset + data.posts.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [hasMore, offset]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current) {
          void loadMore();
        }
      },
      {
        rootMargin: '100px'
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, loadMore]);

  return (
    <div className='space-y-4'>
      {error && (
        <div className='bg-terminal-red/10 border border-terminal-red/30 rounded-lg p-4'>
          <p className='text-terminal-red text-sm font-mono'>Error: {error}</p>
        </div>
      )}

      {posts.map((post) => {
        const date = formatDate(post.publishedAt);

        return (
          <Link key={post._id} href={`/blog/${post.slug.current}`} className='block'>
            <article className='bg-code-bg border border-code-border rounded-lg p-5 hover:border-primary/30 transition-all duration-300 group'>
              <div className='flex flex-col gap-3'>
                <div className='flex flex-wrap items-center gap-3 text-xs text-text-muted font-mono'>
                  <span>{date}</span>
                  {post.readTime && (
                    <>
                      <span className='text-text-muted'>|</span>
                      <span>{post.readTime} min read</span>
                    </>
                  )}
                </div>
                <h2 className='text-primary font-medium text-lg  group-hover:text-primary-hover transition-colors'>
                  {post.title}
                </h2>
                <p className='text-text-secondary text-sm line-clamp-2'>{post.summary}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {post.tags.map((tag) => (
                      <TechBadge key={tag}>{tag}</TechBadge>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </Link>
        );
      })}

      {hasMore && (
        <div ref={loadMoreRef} className='py-8 flex justify-center'>
          {loading ? (
            <div className='flex items-center gap-2 text-text-muted font-mono text-sm'>
              <span className='size-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
              <span>Loading...</span>
            </div>
          ) : (
            <button
              type='button'
              onClick={() => {
                void loadMore();
              }}
              className='px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-mono text-sm'
            >
              Load More Posts
            </button>
          )}
        </div>
      )}

      <div className='text-center text-text-muted text-sm font-mono pt-8 border-t border-code-border'>
        Showing <span className='text-terminal-blue'>{posts.length}</span> of{' '}
        <span className='text-terminal-blue'>{initialTotal}</span> posts
      </div>
    </div>
  );
};

export default BlogListClient;
