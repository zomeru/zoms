import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './schemas';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;

if (!projectId) {
  throw new Error('Missing required environment variable: SANITY_PROJECT_ID');
}
if (!dataset) {
  throw new Error('Missing required environment variable: SANITY_DATASET');
}
export default defineConfig({
  name: 'default',
  title: 'Zoms Portfolio',

  projectId,
  dataset,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes
  }
});
