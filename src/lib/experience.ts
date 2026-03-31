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

export async function getExperience(): Promise<Experience[]> {
  try {
    const experiences = await getSanityClient().fetch<Experience[]>(
      `*[_type == "experience"] | order(order desc) {
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

    return experiences;
  } catch (error) {
    log.warn('Error fetching experience from Sanity, using fallback', {
      error: error instanceof Error ? error.message : String(error)
    });
    return fallbackExperience;
  }
}
