import React from 'react';

const About = (): React.JSX.Element => {
  return (
    <section id='about' className='text-textSecondary space-y-5'>
      <p>
        In 2019, I was considered one of the top programmers in school, but my skills were limited
        to the basics. The Covid pandemic hit in 2020, and with all the free time I had from not
        being able to hang out with friends, I decided to learn web development. I followed
        roadmaps, watched YouTube tutorials, and even bought online courses. I spent more than 12
        hours a day coding and improving my skills. After a few months, I started collaborating with
        co-students on open-source projects and took on small consulting work.
      </p>
      <p>
        In 2021, I got my first big gig as a freelance developer thanks to a colleague who gave me a
        chance to work on a real-world application. I added that experience to my resume and started
        applying for full-time jobs. The following year, while still a student, I landed my first
        full-time remote job as a <span className='highlight'>Full Stack Software Engineer</span>,
        which was pretty cool.
      </p>
      <p>
        These days, my main focus is building responsive and elegant web and mobile applications. I
        love learning new things and also enjoy traveling in my free time. When I&apos;m not in
        front of my computer, I like hanging out with loved ones, including my{' '}
        <span className='highlight'>two dogs</span>.
      </p>
    </section>
  );
};

export default About;
