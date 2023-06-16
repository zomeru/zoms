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
        permanent: false
      },
      {
        source: '/instagram',
        destination: 'https://instagram.com/zomeruu',
        permanent: false
      },
      {
        source: '/linkedin',
        destination: 'https://linkedin.com/in/zomergregorio',
        permanent: false
      },
      {
        source: '/github',
        destination: 'https://github.com/zomeru',
        permanent: false
      }
    ];
  }
};

module.exports = withPWA(nextConfig);
