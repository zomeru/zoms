import { technologies, TITLE } from '@/constants';
import type { NormalizedContentDocument } from '@/lib/content/types';
import { getExperience } from '@/lib/experience';
import { createDocument, slugify } from '@/lib/ingestion/normalize';
import {
  createAboutSections,
  createExperienceSections,
  createExperienceSummary
} from '@/lib/ingestion/sections';

const aboutIntro = `${TITLE} is a Software Engineer based in the Philippines, building modern web experiences with Next.js, TypeScript, and practical AI integrations. Building the future, one line at a time.`;

export async function loadAboutDocuments(): Promise<NormalizedContentDocument[]> {
  const experienceEntries = await getExperience();
  const sections = createAboutSections({
    experienceSummary: createExperienceSummary(experienceEntries),
    intro: aboutIntro,
    skills: technologies.map((technology) => technology.name)
  });

  return [
    createDocument({
      contentType: 'about',
      documentId: 'about:profile',
      sections,
      sourceMeta: {
        profile: TITLE,
        sectionCount: sections.length
      },
      tags: technologies.map((technology) => technology.name),
      title: `${TITLE} Profile`,
      url: '/#about'
    }),
    ...experienceEntries.map((experienceEntry) =>
      createDocument({
        contentType: 'experience',
        documentId: `about:experience:${slugify(`${experienceEntry.company}-${experienceEntry.title}`)}`,
        sections: createExperienceSections(experienceEntry),
        slug: slugify(`${experienceEntry.company}-${experienceEntry.title}`),
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
      })
    )
  ];
}
