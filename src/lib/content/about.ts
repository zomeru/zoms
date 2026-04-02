import { TITLE, technologies } from "@/constants";
import type { NormalizedContentDocument } from "@/lib/content/types";
import { getExperience } from "@/lib/experience";
import { createDocument } from "@/lib/ingestion/normalize";
import { createAboutSections, createExperienceSummary } from "@/lib/ingestion/sections";

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
      contentType: "about",
      documentId: "about:profile",
      sections,
      sourceMeta: {
        profile: TITLE,
        sectionCount: sections.length
      },
      tags: technologies.map((technology) => technology.name),
      title: `${TITLE} Profile`,
      url: "/#about"
    })
  ];
}
