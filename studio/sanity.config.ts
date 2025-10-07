import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { config } from './config';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'default',
  title: 'Zoms Portfolio',

  projectId: config.projectId,
  dataset: config.dataset,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes
  }
});
