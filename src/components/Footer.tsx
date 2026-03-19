import React from 'react';
import Link from 'next/link';

import { TITLE } from '@/constants';

const Footer: React.FC = (): React.JSX.Element => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id='contact' className='py-16 mt-8 border-t border-border'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
        <div>
          <h3 className='text-lg font-medium tex-primary mb-2'>
            Let&apos;s build something together
          </h3>
          <p className='text-text-secondary text-sm mb-4'>
            Feel free to reach out for collaborations or just to say hello.
          </p>
          <a
            href='mailto:zomergregorio@gmail.com'
            className='inline-flex items-center gap-2 text-primary hover:underline font-mono text-sm'
          >
            <span className='text-terminal-green'>➜</span>
            <span>zomergregorio@gmail.com</span>
          </a>
        </div>

        <div className='text-sm text-text-muted'>
          <div className='flex flex-col gap-1 text-left md:text-right font-mono text-xs'>
            <span>
              <span className='text-secondary'>const</span>{' '}
              <span className='text-terminal-green'>year</span>{' '}
              <span className='text-[#e2e8f0]'>=</span>{' '}
              <span className='text-terminal-purple'>{currentYear};</span>
            </span>
            <span>
              <span className='text-secondary'>const</span>{' '}
              <span className='text-terminal-green'>builtWith</span>{' '}
              <span className='text-[#e2e8f0]'>=</span>{' '}
              <span className='text-terminal-purple'>["Next.js", "Tailwind"];</span>
            </span>
            <span>
              <span className='text-secondary'>const</span>{' '}
              <span className='text-terminal-green'>deployed</span>{' '}
              <span className='text-[#e2e8f0]'>=</span>{' '}
              <span className='text-terminal-purple'>"Vercel";</span>
            </span>
          </div>
        </div>
      </div>

      <div className='mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4'>
        <div className='text-sm text-text-muted font-mono'>
          <span className='text-terminal-green'>©</span>{' '}
          <Link href='/' className='hover:text-primary transition-colors'>
            {TITLE}
          </Link>
          <span className='text-muted'>{'// All rights reserved'}</span>
        </div>

        <div className='flex gap-6 text-sm font-mono'>
          <Link href='/github' className='text-text-muted hover:text-primary transition-colors'>
            github
          </Link>
          <Link href='/linkedin' className='text-text-muted hover:text-primary transition-colors'>
            linkedin
          </Link>
          <Link href='/instagram' className='text-text-muted hover:text-primary transition-colors'>
            instagram
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
