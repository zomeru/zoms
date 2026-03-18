import type { Viewport } from 'next';

import '../styles/globals.css';

import React from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { ParticleBackground } from '@/components';
import { seo } from '@/configs';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap'
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap'
});

export const metadata = {
  ...seo
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0f'
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang='en' className={`${geist.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning={true} className='bg-background text-primary min-h-screen'>
        <ParticleBackground />
        <div id='my-root'>
          <React.Fragment>{children}</React.Fragment>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
