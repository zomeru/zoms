import '../styles/globals.css';
import { Inter } from 'next/font/google';
import React from 'react';

import { seo } from '@/configs';
import { MouseFollower } from '@/components';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  ...seo
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
      </body>
    </html>
  );
}
