import React from 'react';

import { socials } from '@/constants';

const Socials = (): React.JSX.Element => {
  return (
    <div className='flex space-x-3'>
      {socials.map(({ url, Icon }) => (
        <a href={url} key={url} target='_blank' rel='noopener'>
          <Icon className='text-3xl text-textSecondary hover:text-primary transition-colors duration-300 ease-in-out' />
        </a>
      ))}
    </div>
  );
};

export default Socials;
