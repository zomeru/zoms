import type { NextConfig } from 'next';
import { withBotId } from 'botid/next/config';

const nextConfig: NextConfig = {
  reactCompiler: true,
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
