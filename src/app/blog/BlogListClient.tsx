'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

import type { BlogPostListItem } from '@/lib/blog';

import GenerateBlogModal from './GenerateBlogModal';

interface BlogListClientProps {
  initialPosts: BlogPostListItem[];
  initialTotal: number;
}

const BlogListClient: React.FC<BlogListClientProps> = ({ initialPosts, initialTotal }) => {
  const [posts, setPosts] = useState<BlogPostListItem[]>(initialPosts);
  const [offset, setOffset] = useState<number>(initialPosts.length);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const hasMore = offset < total;

  const loadMore = async (): Promise<void> => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blog?limit=25&offset=${offset}`);

      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response is validated by backend
      const data = (await response.json()) as {
        posts: BlogPostListItem[];
        pagination: { limit: number; offset: number; total: number; hasMore: boolean };
      };

      setPosts([...posts, ...data.posts]);
      setOffset(offset + data.posts.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more posts');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBlog = async (token: string): Promise<void> => {
    const toastId = toast.loading('Generating blog post with AI...');

    try {
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response is validated by backend
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Failed to generate blog post');
      }

      toast.success('Blog post generated successfully!', { id: toastId });

      // Fetch the updated list of posts
      const listResponse = await fetch('/api/blog?limit=25&offset=0');
      if (listResponse.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response is validated by backend
        const listData = (await listResponse.json()) as {
          posts: BlogPostListItem[];
          pagination: { limit: number; offset: number; total: number; hasMore: boolean };
        };
        setPosts(listData.posts);
        setTotal(listData.pagination.total);
        setOffset(listData.posts.length);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate blog post';
      toast.error(errorMessage, { id: toastId });
      throw err;
    }
  };

  return (
    <>
      <Toaster
        position='top-center'
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#f2f2f2',
            border: '1px solid rgba(145, 145, 145, 0.2)'
          },
          success: {
            iconTheme: {
              primary: '#ad5aff',
              secondary: '#f2f2f2'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f2f2f2'
            }
          }
        }}
      />

      <GenerateBlogModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onGenerate={handleGenerateBlog}
      />

      {/* Generate Blog Button */}
      <div className='mb-8 flex justify-center'>
        <button
          onClick={() => {
            setIsModalOpen(true);
          }}
          className='px-6 py-3 bg-secondary text-backgroundPrimary rounded-lg hover:bg-opacity-80 transition-all font-medium flex items-center gap-2'
        >
          <span>🤖</span>
          <span>Generate Blog with AI</span>
        </button>
      </div>

      {/* Load More Button - Top */}
      {hasMore && (
        <div className='mb-8 flex justify-center'>
          <button
            onClick={() => {
              void loadMore();
            }}
            disabled={loading}
            className='px-6 py-3 bg-primary text-textPrimary rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium'
          >
            {loading ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='mb-8 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg'>
          <p className='text-red-400 text-sm'>{error}</p>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div className='grid grid-cols-1 gap-6 mb-8'>
        {posts.map((post) => {
          const date = new Date(post.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return (
            <article
              key={post._id}
              className='group p-6 rounded-lg border border-textSecondary border-opacity-20 hover:border-primary hover:border-opacity-50 transition-all duration-300 hover:bg-[#ad5aff0a]'
            >
              <div className='flex flex-col sm:flex-row sm:items-start gap-4'>
                <div className='sm:w-32 flex-shrink-0'>
                  <time className='text-textSecondary text-sm'>{date}</time>
                  {post.generated && (
                    <span
                      className='block mt-1 text-xs text-textSecondary opacity-60'
                      title='AI Generated'
                    >
                      🤖 AI Generated
                    </span>
                  )}
                </div>
                <div className='flex-grow'>
                  <Link
                    href={`/blog/${post.slug.current}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='group-hover:text-primary transition-colors'
                  >
                    <h2 className='text-xl font-semibold mb-2 transition-colors'>{post.title}</h2>
                  </Link>
                  <p className='text-textSecondary text-sm mb-3'>{post.summary}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className='flex flex-wrap gap-2'>
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className='text-xs px-2 py-1 rounded-full bg-primary bg-opacity-10 text-primary'
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Load More Button - Bottom */}
      {hasMore && (
        <div className='mb-8 flex justify-center'>
          <button
            onClick={() => {
              void loadMore();
            }}
            disabled={loading}
            className='px-6 py-3 bg-primary text-textPrimary rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium'
          >
            {loading ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}

      {/* Showing count */}
      <div className='text-center text-textSecondary text-sm'>
        Showing {posts.length} of {total} posts
      </div>
    </>
  );
};

export default BlogListClient;
