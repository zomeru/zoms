import path from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierConfig from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
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
  ...compat.extends('next/core-web-vitals'),
  prettierConfig,
  {
    rules: {
      // React specific
      'react/react-in-jsx-scope': 'off'
    }
  }
];
