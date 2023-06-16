import React from 'react';

import Socials from './Socials';
import Navigation from './Navigation';
import Link from 'next/link';

const MainInfo = (): React.JSX.Element => {
  return (
    <div className='h-auto lg:h-[calc(100vh-180px)] flex flex-col lg:justify-between justify-normal lg:w-[550px] mr-auto w-full static lg:fixed'>
      <div className='space-y-3 mb-3 lg:mb-0'>
        <Link href='/'>
          <h1 className='md:text-5xl font-bold text-4xl inline-block'>Zomer Gregorio</h1>
        </Link>
        <h2 className='text-xl md:text-2xl font-medium'>Software Engineer</h2>
        <h3 className='max-w-[350px] text-textSecondary'>
          I build responsive, elegant products and digital experiences for the web and mobile.
        </h3>
        <div className='transform translate-y-20'>
          <Navigation />
        </div>
      </div>
      <Socials />
    </div>
  );
};

export default MainInfo;
