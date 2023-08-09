import React from 'react';

import { socials } from '@/constants';

const Socials = (): React.JSX.Element => {
  return (
    <div className='flex space-x-3 items-center'>
      {socials.map(({ url, Icon }) => {
        const label = url.includes('mail') ? 'email' : url.replace('/', '');
        const isTiktok = url.includes('tiktok');

        return (
          <a href={url} key={url} target='_blank' rel='noopener' aria-label={label}>
            <Icon
              className={`text-textSecondary hover:text-primary transition-colors duration-300 ease-in-out ${
                isTiktok ? 'text-2xl' : 'text-3xl'
              }`}
            />
          </a>
        );
      })}
    </div>
  );
};

export default Socials;
