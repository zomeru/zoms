import type { Metadata, Viewport } from 'next';

import '../styles/globals.css';
import '../styles/themes.css';

import React from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { BotIdClient } from 'botid/client';

import GlobalEnhancements from '@/components/GlobalEnhancements';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeRail } from '@/components/theme/ThemeRail';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { Navbar } from '@/components';
import { seo } from '@/configs';
import { BOTID_PROTECTED_ROUTES } from '@/lib/botId';
import { createThemeBootstrapScript } from '@/lib/theme/bootstrap';

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

export const metadata: Metadata = seo;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0f'
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html
      lang='en'
      data-theme='zomeru'
      suppressHydrationWarning={true}
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <BotIdClient protect={BOTID_PROTECTED_ROUTES} />
      </head>
      <body className='bg-background text-text-primary min-h-screen'>
        <Script id='theme-bootstrap' strategy='beforeInteractive'>
          {createThemeBootstrapScript()}
        </Script>
        <ThemeProvider>
          <ThemeRail />
          <ThemeSelector />
          <Navbar />
          <div id='my-root' className='relative min-h-screen'>
            <GlobalEnhancements />
            <React.Fragment>{children}</React.Fragment>
          </div>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
