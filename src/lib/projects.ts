import { projects as fallbackProjects } from '@/constants/projects';

import log from './logger';
import { getSanityClient } from './sanity';

interface ProjectLinks {
  demo: string;
  github: string;
}

export interface Project {
  _id?: string;
  alt: string;
  image: string;
  info: string;
  links: ProjectLinks;
  name: string;
  order: number;
  techs: string[];
}

function getFallbackProjects(): Project[] {
  const highestOrder = fallbackProjects.length - 1;

  return fallbackProjects.map((project, index) => ({
    ...project,
    order: highestOrder - index
  }));
}

export async function getProjects(): Promise<Project[]> {
  try {
    const projects = await getSanityClient().fetch<Project[]>(
      `*[_type == "project"] | order(order desc) {
        _id,
        name,
        image,
        alt,
        info,
        techs,
        "links": {
          "demo": demoUrl,
          "github": githubUrl
        },
        order
      }`,
      {},
      {
        cache: 'no-store'
      }
    );

    if (projects.length === 0) {
      return getFallbackProjects();
    }

    return projects;
  } catch (error) {
    log.warn('Error fetching projects from Sanity, using fallback', {
      error: error instanceof Error ? error.message : String(error)
    });
    return getFallbackProjects();
  }
}
