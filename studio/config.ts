const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const appId = process.env.NEXT_PUBLIC_SANITY_APP_ID;

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable');
}

if (!dataset) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_DATASET environment variable');
}

if (!appId) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_APP_ID environment variable');
}

export const config = {
  dataset,
  projectId,
  appId
};
