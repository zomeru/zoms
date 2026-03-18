import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { SITE_URL } from '@/configs/seo';
import { BLOG_POSTS_PAGE_SIZE } from '@/constants';
import { getBlogPostCount, getBlogPosts } from '@/lib/blog';

import BlogGenerateButton from './BlogGenerateButton';
import BlogListClient from './BlogListClient';

export const metadata: Metadata = {
  title: 'Blog | Zomer Gregorio',
  description:
    'Read articles about web development, React, TypeScript, Next.js, and other software engineering topics.',
  openGraph: {
    title: 'Blog | Zomer Gregorio',
    description:
      'Read articles about web development, React, TypeScript, Next.js, and other software engineering topics.',
    url: `${SITE_URL}/blog`,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Zomer Gregorio',
    description:
      'Read articles about web development, React, TypeScript, Next.js, and other software engineering topics.'
  },
  alternates: {
    canonical: '/blog'
  }
};

const BlogPageContent: React.FC = async (): Promise<React.JSX.Element> => {
  const [posts, total] = await Promise.all([
    getBlogPosts(BLOG_POSTS_PAGE_SIZE, 0),
    getBlogPostCount()
  ]);

  return (
    <>
      <main className='relative z-10 min-h-screen'>
        <div className='max-w-6xl mx-auto px-6 py-16'>
          <div className='mb-12'>
            <Link
              href='/'
              className='inline-flex items-center gap-2 text-primary hover:underline font-mono text-sm mb-8'
            >
              <span className='text-terminal-green'>cd</span>
              <span className='text-text-secondary'>..</span>
              <span className='text-primary'>→</span>
              <span>home</span>
            </Link>

            <div className='bg-code-bg border border-code-border rounded-lg overflow-hidden'>
              <div className='bg-linear-to-b from-border to-surface-elevated border-b border-code-border px-3 py-2 flex items-center gap-2'>
                <div className='flex gap-1.5'>
                  <div className='size-3 rounded-full bg-terminal-red' />
                  <div className='size-3 rounded-full bg-terminal-yellow' />
                  <div className='size-3 rounded-full bg-terminal-green' />
                </div>
                <div className='flex-1 text-center'>
                  <span className='text-xs text-text-muted font-mono'>blog.ts</span>
                </div>
              </div>
              <div className='p-8'>
                <h1 className='text-3xl md:text-4xl font-semibold mb-4 text-primary'>Blog</h1>
                <p className='text-text-secondary font-mono text-sm'>
                  <span className='text-secondary'>const</span>{' '}
                  <span className='text-terminal-green'>description</span>{' '}
                  <span className='text-[#e2e8f0]'>=</span>{' '}
                  <span className='text-terminal-purple'>
                    "Technical articles about web development"
                  </span>
                </p>
              </div>
            </div>
          </div>

          <BlogGenerateButton />

          {posts.length === 0 ? (
            <div className='bg-code-bg border border-code-border rounded-lg p-8 font-mono text-sm'>
              <span className='text-terminal-yellow'>console</span>
              <span className='text-text-secondary'>.log(</span>
              <span className='text-terminal-purple'>"No posts yet. Check back soon!"</span>
              <span className='text-text-secondary'>)</span>
            </div>
          ) : (
            <BlogListClient initialPosts={posts} initialTotal={total} />
          )}
        </div>
      </main>
    </>
  );
};

export default BlogPageContent;
