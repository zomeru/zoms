import React from 'react';

import { technologies } from '@/constants';

const TechStack = (): React.JSX.Element => {
  return (
    <section id='technologies' className='my-32'>
      <h2 className='section-title mb-3'>Technologies</h2>
      <div className='flex flex-wrap'>
        {technologies.map(({ name, Icon }) => (
          <div
            key={name}
            className='flex mr-3 items-center space-x-2 mb-3 px-3 rounded-full py-2 bg-[#ad5aff30]'
          >
            <Icon />
            <span className='text-xs'>{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TechStack;
