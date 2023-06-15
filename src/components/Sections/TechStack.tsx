import React from 'react';

import { technologies } from '@/constants';

const TechStack = (): React.JSX.Element => {
  return (
    <section id='technologies' className='my-32'>
      <h2 className='section-title'>Technologies</h2>
      <div className='flex flex-wrap'>
        {technologies.map(({ name, Icon }) => (
          <div
            key={name}
            className='flex mr-3 items-center space-x-2 mb-3 px-3 rounded-full py-2 bg-[#ad5aff1f]'
          >
            <Icon className='text-testSecondary' />
            <span className='text-xs text-textSecondary'>{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TechStack;
