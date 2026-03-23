import { projects } from '@/constants/projects';
import type { NormalizedContentDocument } from '@/lib/content/types';
import { createDocument, slugify } from '@/lib/ingestion/normalize';
import { createProjectSections } from '@/lib/ingestion/sections';

export type ProjectRecord = (typeof projects)[number];

export function normalizeProjectRecord(project: ProjectRecord): NormalizedContentDocument {
  const slug = slugify(project.name);

  return createDocument({
    contentType: 'project',
    documentId: `project:${slug}`,
    sections: createProjectSections(project),
    sourceMeta: {
      alt: project.alt,
      demoUrl: project.links.demo,
      githubUrl: project.links.github,
      image: project.image
    },
    tags: project.techs,
    title: project.name,
    url: '/#projects'
  });
}

export function loadProjectDocuments(): NormalizedContentDocument[] {
  return projects.map(normalizeProjectRecord);
}
