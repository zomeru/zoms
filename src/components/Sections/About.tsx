import React from 'react';
import Link from 'next/link';

import { technologies } from '@/constants';
import { getGitHubDevStats } from '@/lib/github';
import { getWakaTimeStats } from '@/lib/wakatime';

import Socials from '../Socials';
import TerminalHero from '../TerminalHero';
import { NodeSection, TechBadge, WakaTimeTicker } from '../ui';

const About = async (): Promise<React.JSX.Element> => {
  const [wakaStats, ghStats] = await Promise.all([
    getWakaTimeStats(),
    getGitHubDevStats('zomeru').catch(() => null)
  ]);
  const wakaLanguages = wakaStats?.languages.map((l) => ({ name: l.name, hours: l.hours })) ?? [];
  const ghData = ghStats
    ? {
        totalCommits: ghStats.totalCommits,
        totalPRs: ghStats.totalPRs,
        totalRepos: ghStats.totalRepos,
        username: ghStats.username,
        lastUpdated: ghStats.lastUpdated
      }
    : undefined;

  return (
    <section id='about' className='min-h-screen flex flex-col justify-center py-20'>
      <WakaTimeTicker initialLanguages={wakaLanguages} />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-y-8 md:gap-y-0 md:gap-x-12'>
        <div>
          <div className='mb-12 text-center md:text-left'>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-light mb-4 text-primary'>
              Dev Name
            </h1>
            <p className='text-lg text-text-secondary mb-6'>
              Software Engineer based in Philippines
            </p>
            <div className='flex justify-center md:justify-start'>
              <Socials />
            </div>
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

          <div className='mt-10'>
            <p className='text-xs text-text-muted mb-4 font-mono text-center md:text-left'>
              Tech Stack
            </p>
            <div className='flex flex-wrap gap-2 justify-center md:justify-start'>
              {technologies.map((tech) => (
                <TechBadge
                  key={tech.name}
                  variant='dot'
                  dotColor={tech.color}
                  className='hover:shadow-[0_0_10px_rgba(0,0,0,0.3)]'
                >
                  {tech.name}
                </TechBadge>
              ))}
            </div>
          </div>

          <div className='mt-12 flex flex-wrap gap-4 justify-center md:justify-start'>
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
        </div>

        {/* Right column — NodeSection owns fade cycle + random positions */}
        <div className='relative min-h-105'>
          <NodeSection initialGitHubData={ghData} />
        </div>
      </div>
    </section>
  );
};

export default About;
