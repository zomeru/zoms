import React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';

import ReindexAdminCard from '@/components/ai/ReindexAdminCard';
import { TerminalCard } from '@/components/ui';
import { SITE_URL } from '@/configs/seo';
import { isValidAiReindexSession } from '@/lib/ai/reindexAuth';
import { isValidBlogGenerationSession } from '@/lib/blogGenerationAuth';

import BlogGenerateButton from '../blog/BlogGenerateButton';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Secure admin surface for manual blog generation and targeted AI reindexing.',
  robots: {
    follow: false,
    index: false
  },
  openGraph: {
    description: 'Secure admin surface for manual blog generation and targeted AI reindexing.',
    title: 'Admin',
    type: 'website',
    url: `${SITE_URL}/admin`
  },
  twitter: {
    card: 'summary_large_image',
    description: 'Secure admin surface for manual blog generation and targeted AI reindexing.',
    title: 'Admin'
  },
  alternates: {
    canonical: `${SITE_URL}/admin`
  }
};

const AdminPage: React.FC = async (): Promise<React.JSX.Element> => {
  const cookieStore = await cookies();
  const isBlogGenerationAuthorized = isValidBlogGenerationSession(cookieStore);
  const isAiReindexAuthorized = isValidAiReindexSession(cookieStore);

  return (
    <main className='relative z-10 min-h-screen'>
      <div className='mx-auto max-w-6xl px-6 pb-16 pt-20 md:px-12'>
        <div className='mb-12'>
          <Link
            href='/'
            className='mb-8 inline-flex items-center gap-2 font-mono text-sm text-primary hover:underline'
          >
            <span className='text-terminal-green'>cd</span>
            <span className='text-text-secondary'>..</span>
            <span className='text-primary'>→</span>
            <span>home</span>
          </Link>

          <TerminalCard title='admin.ts' bodyClassName='p-8'>
            <h1 className='mb-4 text-3xl font-semibold text-primary md:text-4xl'>Admin</h1>
            <p className='max-w-3xl font-mono text-sm text-text-secondary'>
              Unlock blog generation and AI reindexing independently. Each panel uses its own
              browser session and secret boundary.
            </p>
          </TerminalCard>
        </div>

        <div className='grid gap-8 lg:grid-cols-2'>
          <div>
            <BlogGenerateButton initialAuthorized={isBlogGenerationAuthorized} />
          </div>
          <div>
            <ReindexAdminCard initialAuthorized={isAiReindexAuthorized} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPage;
