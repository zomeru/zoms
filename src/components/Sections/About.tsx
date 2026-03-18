import React from 'react';
import Link from 'next/link';

import Socials from '../Socials';
import TerminalHero from '../TerminalHero';

const About: React.FC = (): React.JSX.Element => {
  return (
    <section id='about' className='min-h-[80vh] flex flex-col justify-center py-20'>
      <div className='mb-12'>
        <h1 className='text-4xl md:text-5xl lg:text-6xl font-light mb-4 text-primary'>
          Zomer Gregorio
        </h1>
        <p className='text-lg text-text-secondary mb-6'>Software Engineer based in Philippines</p>
        <Socials />
      </div>

      <TerminalHero
        name='Zomer Gregorio'
        role='Software Engineer'
        descriptions={[
          'Building the future, one line at a time.',
          'Full-stack developer & UI enthusiast.',
          'Turning coffee into code since 2020.'
        ]}
      />

      <div className='mt-12 flex flex-wrap gap-4'>
        <Link
          href='#projects'
          className='inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium transition-all duration-300 hover:bg-primary-hover hover:shadow-[0_0_20px_var(--color-accent-glow)] hover:-translate-y-0.5'
        >
          View Projects
          <span className='text-sm'>→</span>
        </Link>
        <Link
          href='#contact'
          className='inline-flex items-center gap-2 px-6 py-3 border border-border text-primary rounded-lg font-medium transition-all duration-300 hover:border-primary hover:text-primary'
        >
          Get in Touch
        </Link>
      </div>
    </section>
  );
};

export default About;
