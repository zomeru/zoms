import { withBotId } from 'botid/next/config';
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is required in dev mode for Next.js react-refresh (HMR).
      // It is NOT included in production builds where react-refresh is absent.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com https://vercel.live`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://va.vercel-scripts.com https://vercel.live https://*.upstash.io https://openrouter.ai https://*.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/facebook',
        destination: 'https://facebook.com/Zomeru',
        permanent: true
      },
      {
        source: '/instagram',
        destination: 'https://instagram.com/zomeruu',
        permanent: true
      },
      {
        source: '/linkedin',
        destination: 'https://linkedin.com/in/zomergregorio',
        permanent: true
      },
      {
        source: '/github',
        destination: 'https://github.com/zomeru',
        permanent: true
      }
    ];
  }
};

export default withBotId(nextConfig);
