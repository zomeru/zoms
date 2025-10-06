import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'default',
  title: 'Zoms Portfolio',

  projectId: 'vap9ch2u',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes
  }
});
