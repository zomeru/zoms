'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { AiOutlineArrowUp } from 'react-icons/ai';
import { FiGithub } from 'react-icons/fi';

import { CodeEditorCard, TechBadge } from '@/components/ui';
import { projects } from '@/constants';

const Projects: React.FC = (): React.JSX.Element => {
  const [perPage, setPerPage] = useState(4);

  const filteredProjects = useMemo(() => {
    return projects.slice(0, perPage);
  }, [perPage]);

  const handleButtonClick = (): void => {
    if (filteredProjects.length === projects.length) {
      setPerPage(4);
    } else {
      setPerPage((prev) => prev + 4);
    }
  };

  return (
    <section id='projects' className='py-20'>
      <h2 className='section-title'>Projects</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {filteredProjects.map(({ name, alt, image, info, techs, links }) => (
          <CodeEditorCard
            key={name}
            filename={`${name.toLowerCase().replace(/\s+/g, '-')}.tsx`}
            language='tsx'
            className='hover:border-border-hover transition-all duration-300 hover:-translate-y-1'
          >
            <div className='relative w-full h-32 mb-4 rounded overflow-hidden border border-code-border'>
              <Image
                src={`/assets/images/projects/${image}`}
                fill
                className='size-full object-cover object-center'
                alt={alt}
                sizes='(max-width: 768px) 100vw, 50vw'
                loading='lazy'
              />
            </div>
            <div className='mb-3'>
              <h3 className='font-medium text-terminal-green'>{name}</h3>
            </div>
            <p className='text-text-secondary text-sm mb-4'>{info}</p>
            <div className='flex flex-wrap gap-2 mb-4'>
              {techs.slice(0, 4).map((tech) => (
                <TechBadge key={tech}>{tech}</TechBadge>
              ))}
              {techs.length > 4 && (
                <span className='text-xs text-muted px-2 py-1'>+{techs.length - 4}</span>
              )}
            </div>
            <div className='flex gap-4 pt-3 border-t border-code-border'>
              <a
                href={links.github}
                className='inline-flex items-center gap-1 text-primary hover:underline text-sm'
                target='_blank'
                rel='noopener noreferrer'
              >
                <FiGithub className='size-4' />
                <span>Source</span>
              </a>
              <a
                href={links.demo}
                className='inline-flex items-center gap-1 text-primary hover:underline text-sm'
                target='_blank'
                rel='noopener noreferrer'
              >
                <span>Live Demo</span>
                <AiOutlineArrowUp className='size-3 rotate-45' />
              </a>
            </div>
          </CodeEditorCard>
        ))}
      </div>

      <div className='mt-8 text-center'>
        <button
          type='button'
          onClick={handleButtonClick}
          className='text-primary hover:underline font-mono text-sm'
        >
          {filteredProjects.length < projects.length ? '// load more' : '// show less'}
        </button>
      </div>
    </section>
  );
};

export default Projects;
