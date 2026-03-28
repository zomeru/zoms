import type { PortableTextBlock } from '@portabletext/types';

import { experience as fallbackExperience } from '@/constants/experience';

import log from './logger';
import { getSanityClient } from './sanity';

export interface Experience {
  _id?: string;
  title: string;
  company: string;
  companyWebsite?: string;
  location: string;
  range: string;
  duties: PortableTextBlock[];
  order: number;
}

function getExperienceKey(experience: Pick<Experience, 'company' | 'title'>): string {
  return `${experience.title}::${experience.company}`.toLowerCase();
}

function mergeExperienceEntries(experiences: Experience[]): Experience[] {
  const merged = new Map<string, Experience>();

  for (const fallbackEntry of fallbackExperience) {
    merged.set(getExperienceKey(fallbackEntry), fallbackEntry);
  }

  for (const experience of experiences) {
    merged.set(getExperienceKey(experience), experience);
  }

  return [...merged.values()].sort((left, right) => left.order - right.order);
}

export async function getExperience(): Promise<Experience[]> {
  try {
    const experiences = await getSanityClient().fetch<Experience[]>(
      `*[_type == "experience"] | order(order asc) {
        _id,
        title,
        company,
        companyWebsite,
        location,
        range,
        duties,
        order
      }`,
      {},
      {
        // Revalidate every 60 seconds
        next: { revalidate: 60 }
      }
    );

    // If no data in Sanity, return fallback
    if (experiences.length === 0) {
      return fallbackExperience;
    }

    return mergeExperienceEntries(experiences);
  } catch (error) {
    log.warn('Error fetching experience from Sanity, using fallback', {
      error: error instanceof Error ? error.message : String(error)
    });
    return fallbackExperience;
  }
}
