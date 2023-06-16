import React from 'react';

import { experience } from '@/constants';

const Experience = (): React.JSX.Element => {
  return (
    <section id='experience' className='mb-24 sm:mb-32'>
      <h2 className='section-title'>Experience</h2>
      <ol className='group/list space-y-10 mb-10'>
        {experience.map(({ id, title, company, location, range, duties }) => (
          <li
            key={id}
            className='group group-hover/list:opacity-50 hover:!opacity-100 transition-all duration-300 ease-in-out hover:after:bg-[#ad5aff0a]  after:content-[""] relative after:absolute after:w-full after:h-full after:top-0 after:left-0 after:transform after:scale-105 after:rounded-lg after:transition-colors after:duration-300 after:ease-in-out after:drop-shadow-md hover:after:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)]'
          >
            <div className='grid grid-cols-8'>
              <div className='col-span-8 sm:col-span-2 text-textSecondary text-sm mb-1 sm:mb-0'>
                {range}
              </div>
              <div className='ml-0 sm:ml-4 col-span-8 sm:col-span-6'>
                <h3 className='text-base group-hover:text-primary'>
                  {title} · {company}
                </h3>
                <span className='text-textSecondary text-sm'>{location}</span>
                <div className='mt-2'>
                  {duties.map((duty) => (
                    <p key={duty} className='text-sm text-textSecondary'>
                      {'- '}
                      {duty}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <a
        href='/assets/resume.pdf'
        target='_blank'
        rel='noopener noreferrer'
        className='link-primary'
      >
        View resume
      </a>
    </section>
  );
};

export default Experience;
