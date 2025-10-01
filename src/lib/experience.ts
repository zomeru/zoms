import { experience as fallbackExperience } from '@/constants/experience';
import type { Experience } from '@/types/experience';

import { client } from './sanity';

export async function getExperience(): Promise<Experience[]> {
  try {
    const experiences = await client.fetch<Experience[]>(
      `*[_type == "experience"] | order(order asc) {
        _id,
        title,
        company,
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
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Allow console in development for debugging
      console.error('Error fetching experience from Sanity:', error);
      // eslint-disable-next-line no-console -- Allow console in development for debugging
      console.log('Using fallback experience data');
    }
    return fallbackExperience;
  }
}
