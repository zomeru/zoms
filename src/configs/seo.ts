import type { Metadata } from 'next';

// Enforce SITE_URL to be set in environment; fallback to localhost in development only
let siteUrl = process.env.SITE_URL;
if (!siteUrl) {
  if (process.env.NODE_ENV === 'development') {
    siteUrl = 'http://localhost:3000';
    console.warn('Warning: SITE_URL is not set. Falling back to http://localhost:3000 for development.');
  } else {
    throw new Error('SITE_URL environment variable must be set in production.');
  }
}
export const SITE_URL = siteUrl;
export const title = 'Zomer Gregorio';
export const description =
  'Hi 👋, I am Zomer, a Software Engineer based in the Philippines with a demonstrated history of working in the information technology and services industry. Skilled in React, Node, Typescript, and other web technologies with 2 years of professional experience in Full Stack Development.';

export const seo: Metadata = {
  title,
  description,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US'
    }
  },
  applicationName: title,
  appleWebApp: {
    capable: true,
    title,
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
  creator: title,
  authors: [{ name: title, url: SITE_URL }],
  openGraph: {
    url: SITE_URL,
    title,
    description,
    images: [
      {
        url: '/assets/icons/opengraph-image.png'
      }
    ],
    type: 'website',
    siteName: title
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
    title,
    images: ['/assets/icons/opengraph-image.png']
  },
  keywords: [
    'Zomer',
    'Zomeru',
    title,
    `${title} | Software Engineer`,
    `${title} | Front End Engineer`,
    `${title} | Full Stack Engineer`,
    `${title} | Web Developer`,
    `${title} | React Developer`
  ]
};
