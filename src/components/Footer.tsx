import React from 'react';

const Footer = (): React.JSX.Element => {
  return (
    <footer className='text-textSecondary text-sm'>
      <p>
        Built with <span className='highlight'>Next.js</span> and{' '}
        <span className='highlight'>Tailwind CSS</span>, deployed with{' '}
        <span className='highlight'>Vercel</span>.
      </p>
      <p>
        &copy; 2023{' '}
        <a className='btn-primary' href='/github' target='_blank' rel='noreferrer noopener'>
          Zomer Gregorio
        </a>
        . All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
