import type { NormalizedContentDocument } from '@/lib/content/types';
import { getExperience, type Experience } from '@/lib/experience';
import { createDocument, slugify } from '@/lib/ingestion/normalize';
import { createExperienceSections } from '@/lib/ingestion/sections';

export function getExperienceSlug(title: string, company: string): string {
  return slugify(`${title}-${company}`);
}

export function getExperienceDocumentId(title: string, company: string): string {
  return `experience:${slugify(title)}:${slugify(company)}`;
}

export function getLegacyExperienceDocumentId(title: string, company: string): string {
  return `about:experience:${slugify(`${company}-${title}`)}`;
}

export function normalizeExperienceRecord(experienceEntry: Experience): NormalizedContentDocument {
  const slug = getExperienceSlug(experienceEntry.title, experienceEntry.company);

  return createDocument({
    contentType: 'experience',
    documentId: getExperienceDocumentId(experienceEntry.title, experienceEntry.company),
    sections: createExperienceSections(experienceEntry),
    slug,
    sourceMeta: {
      company: experienceEntry.company,
      companyWebsite: experienceEntry.companyWebsite,
      dutyCount: experienceEntry.duties.length,
      location: experienceEntry.location,
      order: experienceEntry.order,
      range: experienceEntry.range,
      title: experienceEntry.title
    },
    tags: [experienceEntry.company, experienceEntry.title, experienceEntry.location],
    title: `${experienceEntry.title} at ${experienceEntry.company}`,
    url: '/#experience'
  });
}

export async function loadExperienceDocuments(): Promise<NormalizedContentDocument[]> {
  const experienceEntries = await getExperience();

  return experienceEntries.map(normalizeExperienceRecord);
}
