import React from 'react';

const About = (): React.JSX.Element => {
  return (
    <section id='about' className='text-textSecondary mt-24 sm:mt-32 lg:mt-0'>
      <h2 className='section-title block lg:hidden'>About</h2>
      <div className='space-y-5'>
        {/* <p>
          Back in 2019, I was known as one of the top coders in school, but my skills were kind of
          basic. Then, when Covid hit in 2020, and I couldn&apos;t hang out with friends, I decided
          to dive into web development. I&apos;d spend more than 12 hours daily coding, checking out
          YouTube tutorials, and investing in online courses.
        </p>
        <p>
          After a few months, I started teaming up with classmates on open-source projects and took
          on some small consulting gigs. In 2021, I snagged my first big freelance gig thanks to my
          mentor, who threw me a bone to work on a real-world application. The next year, while
          still in school, I snagged my first full-time remote job as a{' '}
          <span className='highlight cursor-[url("/assets/images/doge-dance-sm.gif"),_pointer]'>
            Full Stack Software Engineer
          </span>
          .
        </p> */}
        <p>
          My main focus these days is building responsive and stylish web and mobile apps. I&apos;m
          all about learning new things and love hitting the road on my motorcycle to beaches and
          mountains when I&apos;m not in front of the screen. Life&apos;s treating me well!
        </p>
      </div>
    </section>
  );
};

export default About;
