import React from 'react';

import { socials } from '@/constants';

const Socials = (): React.JSX.Element => {
  return (
    <div className='flex space-x-3'>
      {socials.map(({ url, Icon }) => {
        const label = url.includes('mail') ? 'email' : url.replace('/', '');

        return (
          <a href={url} key={url} target='_blank' rel='noopener' aria-label={label}>
            <Icon className='text-3xl text-textSecondary hover:text-primary transition-colors duration-300 ease-in-out' />
          </a>
        );
      })}
    </div>
  );
};

export default Socials;
