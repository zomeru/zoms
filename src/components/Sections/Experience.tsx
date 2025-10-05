import React from 'react';
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps
} from '@portabletext/react';

interface LinkValue {
  _type: string;
  href?: string;
}

const portableTextComponents: PortableTextComponents = {
  marks: {
    link: ({ value, children }: PortableTextMarkComponentProps<LinkValue>) => {
      const href = value?.href;
      return (
        <a
          href={href}
          target='_blank'
          rel='noopener noreferrer'
          className='group-hover:text-primary hover:underline transition-colors'
        >
          {children}
        </a>
      );
    },
    strong: ({ children }) => <strong className='font-semibold'>{children}</strong>,
    em: ({ children }) => <em className='italic'>{children}</em>
  },
  block: {
    normal: ({ children }) => <p className='text-sm text-textSecondary'>{children}</p>
  },
  list: {
    bullet: ({ children }) => <>{children}</>,
    number: ({ children }) => <>{children}</>
  },
  listItem: {
    bullet: ({ children }) => (
      <p className='text-sm text-textSecondary'>
        {'- '}
        {children}
      </p>
    ),
    number: ({ children, index }) => (
      <p className='text-sm text-textSecondary'>
        {`${index + 1}. `}
        {children}
      </p>
    )
  }
};

const Experience = async (): Promise<React.JSX.Element> => {
  const { getExperience } = await import('@/lib/experience');
  const experience = await getExperience();

  return (
    <section id='experience' className='mb-24 sm:mb-32'>
      <h2 className='section-title'>Experience</h2>
      <ol className='group/list space-y-10 mb-10'>
        {experience.map(({ title, company, companyWebsite, location, range, duties }) => {
          const id =
            title.replaceAll(' ', '-').toLowerCase() +
            '-' +
            company.replaceAll(' ', '-').toLowerCase();

          return (
            <li
              key={id}
              className='group lg:group-hover/list:opacity-50 lg:hover:!opacity-100 transition-all duration-300 ease-in-out hover:after:bg-[#ad5aff0a] after:content-[""] relative after:absolute after:w-full after:h-full after:top-0 after:left-0 after:transform after:scale-105 after:rounded-lg after:transition-colors after:duration-300 after:ease-in-out after:drop-shadow-md hover:after:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] after:pointer-events-none'
            >
              <div className='grid grid-cols-8'>
                <div className='col-span-8 sm:col-span-2 text-textSecondary text-sm mb-1 sm:mb-0'>
                  {range}
                </div>
                <div className='ml-0 sm:ml-4 col-span-8 sm:col-span-6'>
                  {companyWebsite != null && companyWebsite !== '' ? (
                    <a
                      href={companyWebsite}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='group-hover:text-primary hover:text-primary transition-colors relative z-10'
                    >
                      <h3 className='text-base transition-colors'>
                        {title} · {company}
                      </h3>
                    </a>
                  ) : (
                    <h3 className='text-base group-hover:text-primary transition-colors'>
                      {title} · {company}
                    </h3>
                  )}
                  <span className='text-textSecondary text-sm'>{location}</span>
                  <div className='mt-2'>
                    <PortableText value={duties} components={portableTextComponents} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
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
