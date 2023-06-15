/** @type {import('next').NextConfig} */
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

module.exports = nextConfig;
