import React from 'react';

import { socials } from '@/constants';

const Socials = (): React.JSX.Element => {
  return (
    <li className='list-none flex space-x-3'>
      {socials.map(({ url, Icon }) => (
        <ul key={url}>
          <a href={url} target='_blank' rel='noopener'>
            <Icon className='text-3xl text-textSecondary hover:text-primary transition-colors duration-300 ease-in-out' />
          </a>
        </ul>
      ))}
    </li>
  );
};

export default Socials;
