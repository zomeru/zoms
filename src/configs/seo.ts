import { type Metadata } from 'next';

export const SITE_URL = process.env.SITE_URL;
export const title = 'Zomer Gregorio';
export const description =
  'Hi 👋, I am Zomer, a Software Engineer based in the Philippines with a demonstrated history of working in the information technology and services industry. Skilled in React, Node, Typescript, and other web technologies with 2 years of professional experience in Full Stack Development.';

export const seo: Metadata = {
  title,
  description,
  metadataBase: new URL(SITE_URL!),
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
  openGraph: {
    url: SITE_URL,
    title,
    description,
    images: [
      {
        url: `${SITE_URL}/assets/images/og.png`
      }
    ]
  },
  formatDetection: {
    telephone: false
  },
  manifest: '/assets/icons/site.webmanifest',
  twitter: {
    creator: '@zomeru_sama',
    site: SITE_URL,
    card: 'summary_large_image'
  },
  keywords: ['Zomer Gregorio', 'Zomer', 'Zomeru', title, `${title} | Software Engineer`],
  viewport:
    'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover'
};
