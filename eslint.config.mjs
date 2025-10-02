import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended
});

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'studio/**',
      '*.config.js',
      '*.config.mjs',
      'next-env.d.ts',
      'next-sitemap.config.js'
    ]
  },
  ...compat.config({
    extends: ['next']
  })
];
