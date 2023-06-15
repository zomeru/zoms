const title = 'Zomer Gregorio';
const description =
  'Hi 👋, I am Zomer, a Software Engineer based in the Philippines with a demonstrated history of working in the information technology and services industry. Skilled in React, Node, Typescript, and other web technologies with 2 years of professional experience in Full Stack Development.';

export const seo = {
  title,
  description,
  canonical: process.env.SITE_URL,
  openGraph: {
    url: process.env.SITE_URL,
    title,
    description,
    images: [
      {
        url: `${process.env.SITE_URL}/assets/images/og.png`
      }
    ],
    site_name: title
  },
  twitter: {
    handle: '@zomeru_sama',
    site: process.env.SITE_URL,
    cardType: 'summary_large_image'
  }
};
