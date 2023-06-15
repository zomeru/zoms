import React from 'react';
import Link from 'next/link';

import Socials from './Socials';

const MainInfo = (): React.JSX.Element => {
  return (
    <div className='h-[calc(100vh-180px)] flex flex-col justify-between w-[550px] mr-auto fixed '>
      <div className='space-y-3'>
        <Link href='/'>
          <h1 className='text-5xl font-bold'>Zomer Gregorio</h1>
        </Link>
        <h2 className='text-2xl font-medium'>Software Engineer</h2>
        <h3 className='max-w-[300px] text-textSecondary'>
          I build responsive and elegant products for the web and mobile.
        </h3>
        <div className='transform translate-y-20'>NAVIGATION</div>
      </div>
      <Socials />
    </div>
  );
};

export default MainInfo;
