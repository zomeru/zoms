import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { TechBadge } from '@/components/ui';
import { SITE_URL } from '@/configs/seo';
import { getBlogPostBySlug } from '@/lib/blog';
import { processMarkdown } from '@/lib/unified';
import { formatDateWithTime } from '@/lib/utils';

import BlogContent from './BlogContent';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Zomer Gregorio',
      description: 'The blog post you are looking for could not be found.'
    };
  }

  const publishedTime = new Date(post.publishedAt).toISOString();
  const modifiedTime = post.modifiedAt ? new Date(post.modifiedAt).toISOString() : publishedTime;

  return {
    title: `${post.title} | Zomer Gregorio`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `${SITE_URL}/blog/${slug}`,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: ['Zomer Gregorio'],
      tags: post.tags
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary
    },
    alternates: {
      canonical: `/blog/${slug}`
    },
    keywords: post.tags
  };
}

const BlogPostPage = async ({ params }: BlogPostPageProps): Promise<React.JSX.Element> => {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const publishedDate = formatDateWithTime(post.publishedAt);

  const content = await processMarkdown(post.body);

  return (
    <>
      <main className='relative z-10 min-h-screen'>
        <div className='max-w-7xl mx-auto px-6 pb-16 pt-20'>
          <Link
            href='/blog'
            className='inline-flex items-center gap-2 text-primary hover:underline font-mono text-sm mb-8'
          >
            <span className='text-terminal-green'>cd</span>
            <span className='text-text-secondary'>..</span>
            <span className='text-terminal-blue'>→</span>
            <span>blog</span>
          </Link>

          <article className='bg-code-bg border border-code-border rounded-lg overflow-hidden'>
            <div className='bg-surface-elevated/65 border-b border-code-border px-3 py-2 flex items-center gap-2'>
              <div className='flex gap-1.5'>
                <div className='size-3 rounded-full bg-terminal-red' />
                <div className='size-3 rounded-full bg-terminal-yellow' />
                <div className='size-3 rounded-full bg-terminal-green' />
              </div>
              <div className='flex-1 text-center'>
                <span className='text-xs text-text-muted font-mono'>{slug}.md</span>
              </div>
            </div>

            <div className='p-8'>
              <header className='mb-8'>
                <h1 className='text-3xl md:text-4xl font-semibold mb-4 text-primary'>
                  {post.title}
                </h1>

                <div className='flex flex-wrap items-center gap-3 text-sm text-text-muted font-mono mb-6'>
                  <span>
                    <span className='text-secondary'>const</span>{' '}
                    <span className='text-terminal-green'>published</span>{' '}
                    <span className='text-text-secondary'>=</span>{' '}
                    <span className='text-terminal-purple'>"{publishedDate}";</span>
                  </span>
                  {post.readTime && (
                    <span>
                      <span className='text-secondary'>const</span>{' '}
                      <span className='text-terminal-green'>readTime</span>{' '}
                      <span className='text-text-secondary'>=</span>{' '}
                      <span className='text-terminal-purple'>{post.readTime} min;</span>
                    </span>
                  )}
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className='flex flex-wrap gap-2 mb-6'>
                    {post.tags.map((tag) => (
                      <TechBadge key={tag}>{tag}</TechBadge>
                    ))}
                  </div>
                )}

                <div className='text-text-secondary text-lg leading-relaxed'>{post.summary}</div>
              </header>

              <div className='prose prose-invert max-w-none'>
                <BlogContent body={content} />
              </div>
            </div>
          </article>

          <footer className='mt-8 pt-8 border-t border-border'>
            <Link
              href='/blog'
              className='inline-flex items-center gap-2 text-primary hover:underline font-mono text-sm'
            >
              <span className='text-terminal-green'>cd</span>
              <span className='text-text-secondary'>..</span>
              <span className='text-terminal-blue'>→</span>
              <span>back to blog</span>
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
};

export default BlogPostPage;
