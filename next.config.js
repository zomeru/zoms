/** @type {import('next').NextConfig} */

const withPWA = require('@imbios/next-pwa')({
  dest: 'public',
  scope: '/',
  sw: 'service-worker.js',
  register: true
});

const nextConfig = {
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

module.exports = withPWA(nextConfig);
