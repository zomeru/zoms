import type { Viewport } from 'next';

import '../styles/globals.css';

import React from 'react';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';

import { MouseFollower } from '@/components';
import { seo } from '@/configs';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  ...seo
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
  themeColor: '#ad5aff'
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang='en'>
      <body
        suppressHydrationWarning={true}
        className={`bg-backgroundPrimary h-screen text-textPrimary ${inter.className}`}
      >
        <div id='my-root'>
          <React.Fragment>
            <MouseFollower />
            {children}
          </React.Fragment>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
