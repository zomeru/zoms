import { createClient } from 'next-sanity';

let clientInstance: ReturnType<typeof createClient> | undefined;

export function getSanityClient(): ReturnType<typeof createClient> {
  if (clientInstance) {
    return clientInstance;
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!projectId || !dataset) {
    throw new Error(
      'Sanity client requires NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.'
    );
  }

  clientInstance = createClient({
    projectId,
    dataset,
    apiVersion: '2026-03-31',
    useCdn: process.env.NODE_ENV === 'production',
    perspective: 'published'
  });

  return clientInstance;
}
