import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { TerminalCard } from '@/components/ui';
import { SITE_URL } from '@/configs/seo';
import { BLOG_POSTS_PAGE_SIZE } from '@/constants';
import { getBlogPostCount, getBlogPosts } from '@/lib/blog';

import BlogGenerateButton from './BlogGenerateButton';
import BlogListClient from './BlogListClient';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Read articles about web development, React, TypeScript, Next.js, and other software engineering topics.',
  openGraph: {
    title: 'Blog',
    description:
      'Read articles about web development, React, TypeScript, Next.js, and other software engineering topics.',
    url: `${SITE_URL}/blog`,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog',
    description:
      'Read articles about web development, React, TypeScript, Next.js, and other software engineering topics.'
  },
  alternates: {
    canonical: `${SITE_URL}/blog`
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
        <div className='max-w-7xl mx-auto px-6 md:px-12 pb-16 pt-20'>
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

            <TerminalCard title='blog.ts' bodyClassName='p-8'>
              <h1 className='text-3xl md:text-4xl font-semibold mb-4 text-primary'>Blog</h1>
              <p className='text-text-secondary font-mono text-sm'>
                <span className='text-secondary'>const</span>{' '}
                <span className='text-terminal-green'>description</span>{' '}
                <span className='text-[#e2e8f0]'>=</span>{' '}
                <span className='text-terminal-purple'>
                  "Technical articles about web development";
                </span>
              </p>
            </TerminalCard>
          </div>

          <BlogGenerateButton />

          {posts.length === 0 ? (
            <TerminalCard showHeader={false} bodyClassName='p-8 font-mono text-sm'>
              <span className='text-terminal-yellow'>console</span>
              <span className='text-text-secondary'>.log(</span>
              <span className='text-terminal-purple'>"No posts yet. Check back soon!"</span>
              <span className='text-text-secondary'>)</span>
            </TerminalCard>
          ) : (
            <BlogListClient initialPosts={posts} initialTotal={total} />
          )}
        </div>
      </main>
    </>
  );
};

export default BlogPageContent;
