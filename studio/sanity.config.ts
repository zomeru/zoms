import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './schemas';

const projectId = 'vap9ch2u';
const dataset = 'production';

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
