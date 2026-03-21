import type { Metadata } from 'next';

import { TITLE } from '@/constants';

export interface StaticOgImageContent {
  eyebrow: string;
  title: string;
  description: string;
  footerLabel: string;
}

// Enforce SITE_URL to be set in environment; fallback to localhost in development only
let siteUrl = process.env.SITE_URL;
if (!siteUrl) {
  if (process.env.NODE_ENV === 'development') {
    siteUrl = 'http://localhost:3000';
  } else {
    throw new Error('SITE_URL environment variable must be set in production.');
  }
}
export const SITE_URL = siteUrl;

export const description =
  'Software Engineer from the Philippines building full-stack products with React, TypeScript, Next.js, and AI.';

export const staticOgImages: Record<'home' | 'blog', StaticOgImageContent> = {
  home: {
    eyebrow: 'Portfolio',
    title: TITLE,
    description,
    footerLabel: siteUrl
  },
  blog: {
    eyebrow: 'Blog',
    title: 'Engineering Notes and Technical Articles',
    description:
      'Read articles about web development, React, TypeScript, Next.js, and practical software engineering.',
    footerLabel: `${siteUrl}/blog`
  }
};

export const seo: Metadata = {
  title: {
    default: TITLE,
    template: `%s | ${TITLE}`
  },
  description: `Hi, I'm ${TITLE}, a ${description}`,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US'
    }
  },
  applicationName: TITLE,
  appleWebApp: {
    capable: true,
    title: TITLE,
    statusBarStyle: 'default'
  },
  icons: {
    other: [
      { url: '/assets/icons/favicon-16x16.png', sizes: '16x16' },
      { url: '/assets/icons/favicon-32x32.png', sizes: '32x32' },
      { url: '/assets/icons/safari-pinned-tab.svg', rel: 'mask-icon' }
    ],
    icon: '/favicon.ico',
    apple: '/assets/icons/apple-icon.png'
  },
  creator: TITLE,
  authors: [{ name: TITLE, url: SITE_URL }],
  openGraph: {
    url: SITE_URL,
    title: TITLE,
    description,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${TITLE} Open Graph image`
      }
    ],
    type: 'website',
    siteName: TITLE
  },
  formatDetection: {
    telephone: false
  },
  manifest: '/manifest.json',
  twitter: {
    creator: '@zomeru_sama',
    site: SITE_URL,
    card: 'summary_large_image',
    description,
    title: TITLE,
    images: ['/opengraph-image']
  },
  keywords: [
    'Zomer',
    'Zomeru',
    TITLE,
    `${TITLE} | Software Engineer`,
    `${TITLE} | Front End Engineer`,
    `${TITLE} | Full Stack Engineer`,
    `${TITLE} | Web Developer`,
    `${TITLE} | React Developer`
  ]
};
