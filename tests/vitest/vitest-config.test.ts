import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import vitestConfig from '../../vitest.config';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const repositoryRoot = path.resolve(currentDirectory, '../..');

describe('vitest config', () => {
  it('does not hardcode a machine-specific server-only alias path', () => {
    const configSource = readFileSync(path.join(repositoryRoot, 'vitest.config.ts'), 'utf8');

    expect(configSource).not.toContain('/Users/zomeru/Desktop/zoms');
  });

  it('maps server-only to the repo-local mock path', () => {
    expect(vitestConfig.resolve?.alias).toMatchObject({
      'server-only': path.join(repositoryRoot, 'tests/vitest/mocks/server-only.ts')
    });
  });
});
