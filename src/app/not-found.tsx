import React from 'react';
import Link from 'next/link';

import { TerminalCard } from '@/components/ui';
import { seo } from '@/configs';

export const metadata = {
  ...seo
};

const NotFound = (): React.JSX.Element => {
  return (
    <main className='grid min-h-screen place-items-center px-6 py-16'>
      <div className='w-full max-w-3xl'>
        <TerminalCard title='404.tsx' bodyClassName='p-6 font-mono text-sm md:p-8'>
          <div className='flex flex-col gap-6'>
            <div className='space-y-2'>
              <p className='text-xs uppercase tracking-[0.24em] text-text-muted'>System Response</p>
              <h1 className='text-5xl font-semibold tracking-tight text-primary md:text-7xl'>
                404
              </h1>
              <p className='text-lg text-text-secondary md:text-xl'>Page not found</p>
            </div>

            <div className='rounded-md border border-code-border bg-surface-elevated/30 p-4'>
              <div className='space-y-2 leading-relaxed'>
                <p>
                  <span className='text-terminal-green'>$</span>{' '}
                  <span className='text-text-primary'>open current-route</span>
                </p>
                <p>
                  <span className='text-terminal-red'>Error:</span>{' '}
                  <span className='text-terminal-purple'>"route_not_found"</span>
                </p>
                <p className='text-text-muted'>
                  The page you requested does not exist or may have been moved to a different path.
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <Link
                href='/'
                className='inline-flex items-center gap-2 rounded-md border border-terminal-green/40 bg-terminal-green/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-terminal-green transition-colors hover:bg-terminal-green/15'
              >
                <span>cd</span>
                <span>go home</span>
              </Link>
              <span className='text-xs text-text-muted'>Return to the main terminal.</span>
            </div>
          </div>
        </TerminalCard>
      </div>
    </main>
  );
};

export default NotFound;
