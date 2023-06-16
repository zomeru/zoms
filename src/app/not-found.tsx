import React from 'react';
import Link from 'next/link';

import { seo } from '@/configs';

export const metadata = {
  ...seo
};

const NotFound = (): React.JSX.Element => {
  return (
    <main className='h-screen w-screen flex flex-col items-center justify-center'>
      <h1 className='text-7xl sm:text-9xl font-bold text-textPrimary'>404</h1>
      <h2 className='text-3xl font-medium text-textSecondary mb-10 mt-3'>Page Not Found</h2>
      <p className='text-textSecondary'>
        Go to{' '}
        <Link href='/' className='text-textPrimary link-primary'>
          home page
        </Link>
      </p>
    </main>
  );
};

export default NotFound;
