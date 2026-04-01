'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import BlogGenerateButton from '@/components/admin/BlogGenerateButton';
import ReindexAdminCard from '@/components/ai/ReindexAdminCard';
import { TerminalCard } from '@/components/ui';
import { getResponseErrorMessage } from '@/lib/errorMessages';

interface AdminAccessState {
  aiReindexAuthorized: boolean;
  blogGenerationAuthorized: boolean;
}

const AdminConsole: React.FC = () => {
  const [accessState, setAccessState] = useState<AdminAccessState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadAccess = async (): Promise<void> => {
      try {
        const response = await fetch('/api/admin/access');

        if (!response.ok) {
          throw new Error(
            await getResponseErrorMessage(
              response,
              'Unable to verify browser access for admin tools.'
            )
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Route response shape is controlled locally.
        const data = (await response.json()) as AdminAccessState & { success: boolean };

        if (!isCancelled) {
          setAccessState({
            aiReindexAuthorized: data.aiReindexAuthorized,
            blogGenerationAuthorized: data.blogGenerationAuthorized
          });
        }
      } catch (accessError) {
        if (!isCancelled) {
          setError(
            accessError instanceof Error
              ? accessError.message
              : 'Unable to verify browser access for admin tools.'
          );
        }
      }
    };

    void loadAccess();

    return () => {
      isCancelled = true;
    };
  }, []);

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

        {!accessState && !error ? (
          <TerminalCard title='access.log' bodyClassName='p-6 font-mono text-sm'>
            <p className='text-text-secondary'>Verifying browser access for admin tools...</p>
          </TerminalCard>
        ) : null}

        {error ? (
          <TerminalCard title='access-denied.log' bodyClassName='p-6 font-mono text-sm'>
            <p className='text-terminal-red'>{error}</p>
          </TerminalCard>
        ) : null}

        {accessState ? (
          <div className='grid gap-8 lg:grid-cols-2'>
            <div>
              <BlogGenerateButton initialAuthorized={accessState.blogGenerationAuthorized} />
            </div>
            <div>
              <ReindexAdminCard initialAuthorized={accessState.aiReindexAuthorized} />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
};

export default AdminConsole;
