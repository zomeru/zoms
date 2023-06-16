'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';

import { FiGithub } from 'react-icons/fi';
import { AiOutlineArrowUp } from 'react-icons/ai';

import { projects } from '@/constants';

const Projects = (): React.JSX.Element => {
  const [perPage, setPerPage] = useState(4);

  const filteredProjects = useMemo(() => {
    return projects.slice(0, perPage);
  }, [perPage]);

  const handleShowMore = (): void => {
    if (filteredProjects.length === projects.length) return;
    setPerPage((prev) => prev + 4);
  };

  const handleShowLess = (): void => {
    setPerPage(4);
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    e.preventDefault();

    if (filteredProjects.length < projects.length) {
      handleShowMore();
    } else {
      handleShowLess();
    }
  };

  return (
    <section id='projects' className='mb-24 sm:mb-32'>
      <h2 className='section-title'>Projects</h2>
      <ol className='group/list space-y-12 sm:space-y-6 mb-10'>
        {filteredProjects.map(({ name, alt, image, info, techs, links }) => (
          <li
            key={name}
            className='group group-hover/list:opacity-50 hover:!opacity-100 transition-all duration-300 ease-in-out hover:after:bg-[#ad5aff0a]  after:content-[""] after:z-[-1] relative after:absolute after:w-full after:h-full after:top-0 after:left-0 after:transform after:scale-105 after:rounded-lg after:transition-colors after:duration-300 after:ease-in-out after:drop-shadow-md hover:after:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)]'
          >
            <div className='grid  grid-cols-8 z-10'>
              <div className='col-span-8 sm:col-span-2 relative w-[200px] sm:w-full h-[100px] lg:h-[70px] mt-1 rounded-md overflow-hidden border border-gray-400 order-last sm:order-first'>
                <Image
                  src={`/assets/images/projects/${image}`}
                  fill
                  className='w-full h-full object-cover object-center'
                  alt={alt}
                  sizes='(max-width: 768px) 100vw'
                  loading='lazy'
                />
              </div>
              <div className='ml-0 sm:ml-4 col-span-8 sm:col-span-6'>
                <h3 className='text-base group-hover:text-primary mb-2'>{name}</h3>
                <div className='mb-2 flex space-x-4'>
                  <a
                    href={links.github}
                    className='flex items-center text-textSecondary text-sm space-x-1 transition-colors duration-300 ease-in-out hover:text-primary'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <span>Github</span>
                    <FiGithub />
                  </a>
                  <a
                    href={links.demo}
                    className='flex items-center text-textSecondary text-sm space-x-1 transition-colors duration-300 ease-in-out hover:text-primary'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <span>Link</span>
                    <AiOutlineArrowUp className='transform rotate-45' />
                  </a>
                </div>
                <p className='text-sm text-textSecondary mb-3'>{info}</p>
                <ul className='flex flex-wrap'>
                  {techs.map((tech) => (
                    <li
                      key={tech}
                      className='mr-3 items-center mb-3 px-3 rounded-full bg-[#ad5aff1f]'
                    >
                      <span className='text-xs text-textSecondary text-center'>{tech}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button className='outline-none' type='button' onClick={handleButtonClick}>
        <span className='link-primary'>
          {filteredProjects.length < projects.length ? 'Show more' : 'Show less'}
        </span>
      </button>
    </section>
  );
};

export default Projects;
