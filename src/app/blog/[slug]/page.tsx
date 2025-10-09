import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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

  const modifiedDate = post.modifiedAt ? formatDateWithTime(post.modifiedAt) : null;

  const content = await processMarkdown(post.body);

  return (
    <main className='max-w-[1200px] mx-auto px-6 sm:px-12 md:px-16 lg:px-20 py-[50px] md:py-[90px]'>
      {/* Back Link */}
      <Link href='/blog' className='text-primary hover:underline mb-8 inline-block'>
        ← Back to blog
      </Link>

      {/* Article Header */}
      <header className='mb-12'>
        <h1 className='text-4xl md:text-5xl font-bold mb-4 text-textPrimary'>{post.title}</h1>

        <div className='flex flex-wrap items-center gap-4 text-textSecondary text-sm mb-4'>
          <time dateTime={post.publishedAt}>Published {publishedDate}</time>
          {modifiedDate && post.modifiedAt !== post.publishedAt && (
            <>
              <span>•</span>
              <time dateTime={post.modifiedAt}>Updated {modifiedDate}</time>
            </>
          )}
          {post.readTime && (
            <>
              <span>•</span>
              <span>{post.readTime} min read</span>
            </>
          )}
          {post.generated && (
            <>
              <span>•</span>
              <span className='flex items-center gap-1' title='AI Generated'>
                <span>🤖</span> AI Generated
              </span>
            </>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className='flex flex-wrap gap-2 mb-6'>
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

        <p className='text-lg text-textSecondary'>{post.summary}</p>
      </header>

      <BlogContent body={content} />

      {/* Footer */}
      <footer className='mt-16 pt-8 border-t border-textSecondary border-opacity-20'>
        <Link href='/blog' className='text-primary hover:underline'>
          ← Back to all posts
        </Link>
      </footer>
    </main>
  );
};

export default BlogPostPage;
