import React from 'react';

const About = (): React.JSX.Element => {
  return (
    <section id='about' className='text-textSecondary mt-24 sm:mt-32 lg:mt-0'>
      <h2 className='section-title block lg:hidden'>About</h2>
      <div className='space-y-5'>
        <p>
          My main focus these days is building responsive and stylish web and mobile apps. I&apos;m
          all about learning new things and love hitting the road on my motorcycle to beaches and
          mountains when I&apos;m not in front of the screen.
        </p>
      </div>
    </section>
  );
};

export default About;
