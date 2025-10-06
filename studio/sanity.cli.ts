import { defineCliConfig } from 'sanity/cli';

import { config } from './config';

export default defineCliConfig({
  api: {
    projectId: config.projectId,
    dataset: config.dataset
  },
  deployment: {
    appId: config.appId
  }
});
