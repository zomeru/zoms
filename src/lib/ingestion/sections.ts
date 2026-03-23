import type { PortableTextBlock, PortableTextSpan } from '@portabletext/types';

import type { projects } from '@/constants/projects';
import type { NormalizedContentSection } from '@/lib/content/types';
import type { Experience } from '@/lib/experience';

import { slugify } from './normalize';

export interface AboutContentSource {
  experienceSummary: string[];
  intro: string;
  skills: string[];
}

export function splitMarkdownIntoSections(markdown: string): NormalizedContentSection[] {
  const sections: NormalizedContentSection[] = [];
  let currentTitle = 'Body';
  let currentId = 'body';
  let buffer: string[] = [];
  let inCodeFence = false;

  const flush = (): void => {
    const content = buffer.join('\n').trim();

    if (content.length === 0) {
      buffer = [];
      return;
    }

    sections.push({
      content,
      id: currentId,
      title: currentTitle
    });

    buffer = [];
  };

  for (const line of markdown.split('\n')) {
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      buffer.push(line);
      continue;
    }

    const headingMatch = /^#{1,6}\s+(.*)$/.exec(line);
    if (!inCodeFence && headingMatch?.[1]) {
      flush();
      currentTitle = headingMatch[1].trim();
      currentId = slugify(currentTitle);
      continue;
    }

    buffer.push(line);
  }

  flush();

  return sections.length > 0
    ? sections
    : [
        {
          content: markdown.trim(),
          id: 'body',
          title: 'Body'
        }
      ];
}

export function createProjectSections(
  project: (typeof projects)[number]
): NormalizedContentSection[] {
  return [
    {
      content: project.info,
      id: 'overview',
      title: 'Overview'
    },
    {
      content: project.techs.join('\n'),
      id: 'stack',
      title: 'Stack'
    },
    {
      content: [`Demo: ${project.links.demo}`, `GitHub: ${project.links.github}`].join('\n'),
      id: 'links',
      title: 'Links'
    }
  ];
}

export function flattenDutyText(duty: PortableTextBlock): string {
  return duty.children
    .map((child) => (isPortableTextSpan(child) ? child.text.trim() : undefined))
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .trim();
}

function isPortableTextSpan(
  child: PortableTextBlock['children'][number]
): child is PortableTextSpan {
  return child._type === 'span';
}

export function createExperienceSummary(experienceEntries: Experience[]): string[] {
  return experienceEntries.map((item) => {
    const duties = item.duties.map(flattenDutyText).filter(Boolean).join(' ');
    return [item.title, item.company, item.range, item.location, duties]
      .filter(Boolean)
      .join(' — ');
  });
}

export function createExperienceSections(experienceEntry: Experience): NormalizedContentSection[] {
  const responsibilities = experienceEntry.duties.map(flattenDutyText).filter(Boolean);

  return [
    {
      content: [
        `Position: ${experienceEntry.title}`,
        `Company: ${experienceEntry.company}`,
        `Dates: ${experienceEntry.range}`,
        `Location: ${experienceEntry.location}`,
        experienceEntry.companyWebsite ? `Company website: ${experienceEntry.companyWebsite}` : ''
      ]
        .filter(Boolean)
        .join('\n'),
      id: 'overview',
      title: 'Overview'
    },
    {
      content:
        responsibilities.length > 0
          ? responsibilities.map((responsibility) => `- ${responsibility}`).join('\n')
          : 'Responsibilities not listed.',
      id: 'responsibilities',
      title: 'Responsibilities'
    }
  ];
}

export function createAboutSections(source: AboutContentSource): NormalizedContentSection[] {
  return [
    {
      content: source.intro,
      id: 'intro',
      title: 'Intro'
    },
    {
      content: source.skills.join('\n'),
      id: 'skills',
      title: 'Skills'
    },
    {
      content: source.experienceSummary.join('\n'),
      id: 'experience',
      title: 'Experience'
    }
  ];
}
