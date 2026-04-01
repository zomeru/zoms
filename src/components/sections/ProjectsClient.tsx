'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AiOutlineArrowUp } from 'react-icons/ai';
import { FiGithub } from 'react-icons/fi';

import { CodeEditorCard, TechBadge } from '@/components/ui';
import type { Project } from '@/lib/projects';

interface ProjectsClientProps {
  projects: Project[];
}

interface ProjectCardProps {
  project: Project;
}

interface ProjectDescriptionProps {
  info: string;
  name: string;
}

interface ProjectTechStackProps {
  name: string;
  techs: string[];
}

const ProjectDescription: React.FC<ProjectDescriptionProps> = ({
  info,
  name
}): React.JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const descriptionElement = descriptionRef.current;

    setCanExpand(
      descriptionElement !== null &&
        descriptionElement.scrollHeight > descriptionElement.clientHeight + 1
    );
  }, [info]);

  return (
    <div className='mb-4'>
      <p
        ref={descriptionRef}
        data-testid={`project-description-${name}`}
        className={`text-sm text-text-secondary ${isExpanded ? '' : 'line-clamp-3'}`}
      >
        {info}
      </p>
      {canExpand ? (
        <button
          type='button'
          onClick={() => setIsExpanded((current) => !current)}
          className='mt-2 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-primary transition-colors hover:text-terminal-green'
        >
          <span>{isExpanded ? 'collapse' : 'read more'}</span>
          <span className='sr-only'>{` for ${name}`}</span>
          <AiOutlineArrowUp
            className={`size-3 transition-transform ${isExpanded ? '' : 'rotate-180'}`}
          />
        </button>
      ) : null}
    </div>
  );
};

const ProjectTechStack: React.FC<ProjectTechStackProps> = ({ name, techs }): React.JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const stackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stackElement = stackRef.current;
    setCanExpand(stackElement !== null && stackElement.scrollWidth > stackElement.clientWidth + 1);
  }, [techs]);

  return (
    <div className='mb-4'>
      <div className='flex items-start gap-2'>
        <div
          ref={stackRef}
          data-testid={`project-tech-stack-${name}`}
          className={`relative min-w-0 flex-1 gap-2 ${isExpanded ? 'flex flex-wrap' : 'flex overflow-hidden whitespace-nowrap'}`}
        >
          {techs.map((tech) => (
            <TechBadge key={tech} className={isExpanded ? '' : 'shrink-0'}>
              {tech}
            </TechBadge>
          ))}
          {!isExpanded && canExpand ? (
            <div className='pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-code-bg via-code-bg/90 to-transparent' />
          ) : null}
        </div>
        {canExpand ? (
          <button
            type='button'
            onClick={() => setIsExpanded((current) => !current)}
            aria-label={isExpanded ? 'Collapse tech stack' : 'Show full tech stack'}
            className='mt-0.5 inline-flex size-7 shrink-0 items-center justify-center text-primary transition-colors hover:text-terminal-green'
          >
            <AiOutlineArrowUp
              className={`size-3 transition-transform ${isExpanded ? '' : 'rotate-90'}`}
            />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project }): React.JSX.Element => {
  const { name, alt, image, info, techs, links } = project;

  return (
    <CodeEditorCard
      filename={`${name.toLowerCase().replace(/\s+/g, '-')}.tsx`}
      language='tsx'
      className='h-full hover:border-border-hover transition-all duration-300 hover:-translate-y-1'
    >
      <div className='flex h-full flex-col'>
        <div className='relative mb-4 h-32 w-full overflow-hidden rounded border border-code-border'>
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
        <ProjectDescription info={info} name={name} />
        <ProjectTechStack name={name} techs={techs} />

        <div className='mt-auto flex gap-4 border-t border-code-border pt-3'>
          <a
            href={links.github}
            className='inline-flex items-center gap-1 text-sm text-primary hover:underline'
            target='_blank'
            rel='noopener noreferrer'
          >
            <FiGithub className='size-4' />
            <span>Source</span>
          </a>
          <a
            href={links.demo}
            className='inline-flex items-center gap-1 text-sm text-primary hover:underline'
            target='_blank'
            rel='noopener noreferrer'
          >
            <span>Live Demo</span>
            <AiOutlineArrowUp className='size-3 rotate-45' />
          </a>
        </div>
      </div>
    </CodeEditorCard>
  );
};

const ProjectsClient: React.FC<ProjectsClientProps> = ({ projects }): React.JSX.Element => {
  const [perPage, setPerPage] = useState(4);

  const filteredProjects = useMemo(() => projects.slice(0, perPage), [perPage, projects]);

  const handleButtonClick = (): void => {
    setPerPage((current) => (current >= projects.length ? 4 : current + 4));
  };

  return (
    <>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {filteredProjects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>

      <div className='mt-8 text-center'>
        <button
          type='button'
          onClick={handleButtonClick}
          className='font-mono text-sm text-primary hover:underline'
        >
          {filteredProjects.length < projects.length ? '// load more' : '// show less'}
        </button>
      </div>
    </>
  );
};

export default ProjectsClient;
