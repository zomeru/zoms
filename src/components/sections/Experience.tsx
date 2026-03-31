import React from 'react';
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps
} from '@portabletext/react';

import { TerminalCard } from '@/components/ui';

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
          className='text-primary hover:underline'
        >
          {children}
        </a>
      );
    },
    strong: ({ children }) => <strong className='font-semibold text-primary'>{children}</strong>,
    em: ({ children }) => <em className='italic'>{children}</em>
  },
  block: {
    normal: ({ children }) => <p className='text-sm text-text-secondary mb-2'>{children}</p>
  },
  list: {
    bullet: ({ children }) => <>{children}</>,
    number: ({ children }) => <>{children}</>
  },
  listItem: {
    bullet: ({ children }) => (
      <p className='text-sm text-text-secondary mb-1'>
        <span className='text-primary'>›</span> {children}
      </p>
    ),
    number: ({ children, index }) => (
      <p className='text-sm text-text-secondary mb-1'>
        <span className='text-primary'>{index + 1}.</span> {children}
      </p>
    )
  }
};

const Experience: React.FC = async (): Promise<React.JSX.Element> => {
  const { getExperience } = await import('@/lib/experience');
  const experience = await getExperience();

  return (
    <section id='experience' className='pb-20'>
      <h2 className='section-title'>Experience</h2>

      <div className='space-y-6'>
        {experience.map(({ title, company, companyWebsite, location, range, duties }) => {
          const id =
            title.replaceAll(' ', '-').toLowerCase() +
            '-' +
            company.replaceAll(' ', '-').toLowerCase();

          return (
            <TerminalCard
              key={id}
              title={`${company.toLowerCase().replace(/\s+/g, '-')}.log`}
              showHeader={true}
              className='hover:border-border-hover transition-colors'
            >
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between flex-wrap gap-2'>
                  <div>
                    <span className='text-terminal-green font-medium'>{title}</span>
                    <span className='text-text-muted'> @ </span>
                    {companyWebsite ? (
                      <a
                        href={companyWebsite}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-terminal-purple hover:underline'
                      >
                        {company}
                      </a>
                    ) : (
                      <span className='text-terminal-purple'>{company}</span>
                    )}
                  </div>
                  <span className='text-muted text-xs font-mono'>{range}</span>
                </div>
                <div className='text-muted text-xs'>
                  <span className='text-terminal-yellow'>location:</span> {location}
                </div>
                <div className='mt-2 pt-3 border-t border-code-border'>
                  <div className='text-muted text-xs mb-2 font-mono'>duties:</div>
                  <PortableText value={duties} components={portableTextComponents} />
                </div>
              </div>
            </TerminalCard>
          );
        })}
      </div>

      <div className='mt-8'>
        <a
          href='/assets/GREGORIO_ZOMER_RESUME.pdf'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 text-primary hover:underline'
        >
          <span className='text-terminal-green'>cat</span>
          <span className='text-terminal-blue'>→</span>
          <span>resume.pdf</span>
        </a>
      </div>
    </section>
  );
};

export default Experience;
