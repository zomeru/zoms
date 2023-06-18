import React from 'react';

import { technologies } from '@/constants';

const TechStack = (): React.JSX.Element => {
  return (
    <section id='technologies' className='my-24 sm:my-32'>
      <h2 className='section-title'>Technologies</h2>
      <ul className='inline-flex flex-wrap gap-3'>
        {technologies.map(({ name, Icon }) => (
          <li
            key={name}
            className='flex items-center space-x-2 px-3 rounded-full py-2 bg-[#ad5aff1f]'
          >
            <Icon className='text-testSecondary' />
            <span className='text-xs text-textSecondary'>{name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default TechStack;
