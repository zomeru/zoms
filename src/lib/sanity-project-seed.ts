import { createClient } from '@sanity/client';

import { projects } from '@/constants/projects';

interface ProjectIdentity {
  _id: string;
  name: string;
}

export interface SanitySeedProjectDocument {
  _id: string;
  _type: 'project';
  alt: string;
  demoUrl: string;
  githubUrl: string;
  image: string;
  info: string;
  name: string;
  order: number;
  techs: string[];
}

function getGeneratedProjectId(name: string): string {
  return `project-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

function isLegacyGeneratedProjectId(id: string): boolean {
  return id.startsWith('project.');
}

function resolveProjectDocumentId(
  projectName: string,
  existingProjects: ProjectIdentity[]
): string {
  const existingId = existingProjects.find(
    (project) => project.name.toLowerCase() === projectName.toLowerCase()
  )?._id;

  if (!existingId || isLegacyGeneratedProjectId(existingId)) {
    return getGeneratedProjectId(projectName);
  }

  return existingId;
}

export function buildProjectSeedDocuments(
  existingProjects: ProjectIdentity[]
): SanitySeedProjectDocument[] {
  const highestOrder = projects.length - 1;

  return projects.map((project, index) => ({
    _id: resolveProjectDocumentId(project.name, existingProjects),
    _type: 'project',
    alt: project.alt,
    demoUrl: project.links.demo,
    githubUrl: project.links.github,
    image: project.image,
    info: project.info,
    name: project.name,
    order: highestOrder - index,
    techs: project.techs
  }));
}

export function createSanityWriteClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN;

  if (!projectId || !dataset || !token) {
    throw new Error(
      'Sanity project seeding requires SANITY_API_TOKEN, NEXT_PUBLIC_SANITY_PROJECT_ID, and NEXT_PUBLIC_SANITY_DATASET.'
    );
  }

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2026-03-31',
    useCdn: false,
    perspective: 'published'
  });
}

export async function seedProjects() {
  const client = createSanityWriteClient();
  const existingProjects = await client.fetch<ProjectIdentity[]>(
    `*[_type == "project"]{
      _id,
      name
    }`
  );
  const documents = buildProjectSeedDocuments(existingProjects);
  let transaction = client.transaction();

  for (const document of documents) {
    transaction = transaction.createOrReplace(document);
  }

  for (const existingProject of existingProjects) {
    if (!isLegacyGeneratedProjectId(existingProject._id)) {
      continue;
    }

    const replacementDocument = documents.find(
      (document) => document.name === existingProject.name
    );

    if (replacementDocument && replacementDocument._id !== existingProject._id) {
      transaction = transaction.delete(existingProject._id);
    }
  }

  await transaction.commit();

  return {
    count: documents.length,
    documents
  };
}
