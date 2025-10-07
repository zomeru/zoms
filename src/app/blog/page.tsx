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

const BlogPage = async (): Promise<React.JSX.Element> => {
  const [posts, total] = await Promise.all([
    getBlogPosts(BLOG_POSTS_PAGE_SIZE, 0),
    getBlogPostCount()
  ]);

  return (
    <main className='max-w-[1000px] mx-auto px-6 sm:px-12 md:px-16 lg:px-20 py-[50px] md:py-[90px]'>
      {/* Header */}
      <div className='mb-12'>
        <Link href='/' className='text-primary hover:underline mb-4 inline-block'>
          ← Back to home
        </Link>
        <h1 className='text-4xl md:text-5xl font-bold mb-4'>Blog</h1>
        <p className='text-textSecondary text-lg'>
          Articles about web development, software engineering, and technology.
        </p>
      </div>

      {/* Generate Blog Button - Always visible */}
      <BlogGenerateButton />

      {/* Blog Posts */}
      {posts.length === 0 ? (
        <div className='text-center py-20'>
          <p className='text-textSecondary text-lg mb-4'>No blog posts yet.</p>
          <p className='text-textSecondary text-sm'>Check back soon for new content!</p>
        </div>
      ) : (
        <BlogListClient initialPosts={posts} initialTotal={total} />
      )}
    </main>
  );
};

export default BlogPage;
