import React from 'react';

import { getProjects } from '@/lib/projects';

import ProjectsClient from './ProjectsClient';

const Projects: React.FC = async (): Promise<React.JSX.Element> => {
  const projects = await getProjects();

  return (
    <section id='projects' className='py-20'>
      <h2 className='section-title'>Projects</h2>
      <ProjectsClient projects={projects} />
    </section>
  );
};

export default Projects;
