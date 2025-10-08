'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { BLOG_POSTS_PAGE_SIZE } from '@/constants';
import type { BlogPostListItem } from '@/lib/blog';
import { getClientErrorMessage } from '@/lib/errorMessages';
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
      setError(getClientErrorMessage(err));
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [hasMore, offset]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current) {
          void loadMore();
        }
      },
      {
        rootMargin: '100px' // Start loading 100px before reaching the bottom
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
    <>
      {/* Error Message */}
      {error && (
        <div className='mb-8 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg'>
          <p className='text-red-400 text-sm'>{error}</p>
        </div>
      )}

      {/* Blog Posts Grid - 2 columns on desktop, 1 on mobile */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        {posts.map((post) => {
          const date = formatDate(post.publishedAt);

          return (
            <article
              key={post._id}
              className='group p-6 rounded-lg border border-textSecondary border-opacity-20 hover:border-primary hover:border-opacity-50 transition-all duration-300 hover:bg-[#ad5aff0a] flex flex-col'
            >
              <div className='flex flex-col gap-3 flex-grow'>
                <div className='flex flex-wrap items-center gap-2 text-sm'>
                  <time className='text-textSecondary'>{date}</time>
                  {post.readTime && (
                    <>
                      <span className='text-textSecondary opacity-40'>•</span>
                      <span className='text-textSecondary opacity-60'>
                        {post.readTime} min read
                      </span>
                    </>
                  )}
                  {post.generated && (
                    <>
                      <span className='text-textSecondary opacity-40'>•</span>
                      <span className='text-textSecondary opacity-60' title='AI Generated'>
                        🤖 AI Generated
                      </span>
                    </>
                  )}
                </div>
                <Link
                  href={`/blog/${post.slug.current}`}
                  className='group-hover:text-primary transition-colors'
                >
                  <h2 className='text-xl font-semibold mb-2 transition-colors'>{post.title}</h2>
                </Link>
                <p className='text-textSecondary text-sm mb-3 flex-grow'>{post.summary}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className='text-xs px-3 py-1 rounded-full bg-[#ad5aff1f] text-textSecondary'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className='mb-8 flex justify-center py-4'>
          {loading ? (
            <div className='flex items-center gap-2 text-textSecondary'>
              <div className='w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin' />
              <span>Loading more posts...</span>
            </div>
          ) : (
            <button
              onClick={() => {
                void loadMore();
              }}
              className='px-6 py-3 bg-primary text-textPrimary rounded-lg hover:bg-opacity-80 transition-all font-medium'
            >
              Load More Posts
            </button>
          )}
        </div>
      )}

      {/* Showing count */}
      <div className='text-center text-textSecondary text-sm'>
        Showing {posts.length} of {initialTotal} posts
      </div>
    </>
  );
};

export default BlogListClient;
