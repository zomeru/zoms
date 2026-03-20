import React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';

import { TerminalCard } from '@/components/ui';
import { SITE_URL } from '@/configs/seo';
import { isValidBlogGenerationSession } from '@/lib/blogGenerationAuth';

import BlogGenerateButton from '../blog/BlogGenerateButton';

export const metadata: Metadata = {
  title: 'Generate Blog',
  description: 'Manually generate a draft blog post from the secure terminal interface.',
  robots: {
    index: false,
    follow: false
  },
  openGraph: {
    title: 'Generate Blog',
    description: 'Manually generate a draft blog post from the secure terminal interface.',
    url: `${SITE_URL}/generate-blog`,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generate Blog',
    description: 'Manually generate a draft blog post from the secure terminal interface.'
  },
  alternates: {
    canonical: `${SITE_URL}/generate-blog`
  }
};

const GenerateBlogPage: React.FC = async (): Promise<React.JSX.Element> => {
  const cookieStore = await cookies();
  const isAuthorized = isValidBlogGenerationSession(cookieStore);

  return (
    <main className='relative z-10 min-h-screen'>
      <div className='mx-auto max-w-5xl px-6 pb-16 pt-20 md:px-12'>
        <div className='mb-12'>
          <Link
            href='/blog'
            className='mb-8 inline-flex items-center gap-2 font-mono text-sm text-primary hover:underline'
          >
            <span className='text-terminal-green'>cd</span>
            <span className='text-text-secondary'>..</span>
            <span className='text-primary'>→</span>
            <span>blog</span>
          </Link>

          <TerminalCard title='generate-blog.ts' bodyClassName='p-8'>
            <h1 className='mb-4 text-3xl font-semibold text-primary md:text-4xl'>Generate Blog</h1>
            <p className='font-mono text-sm text-text-secondary'>
              <span className='text-secondary'>const</span>{' '}
              <span className='text-terminal-green'>mode</span>{' '}
              <span className='text-[#e2e8f0]'>=</span>{' '}
              <span className='text-terminal-purple'>"manual blog generation";</span>
            </p>
          </TerminalCard>
        </div>

        <BlogGenerateButton initialAuthorized={isAuthorized} />
      </div>
    </main>
  );
};

export default GenerateBlogPage;
