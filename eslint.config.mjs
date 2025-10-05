import love from 'eslint-config-love';
import prettierConfig from 'eslint-config-prettier';

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
      'next-sitemap.config.js',
      '**/pnpm-lock.yaml'
    ]
  },

  // Love config for TypeScript
  {
    ...love,
    files: ['**/*.ts', '**/*.tsx']
  },

  // Prettier overrides
  prettierConfig,

  // Custom rules
  {
    rules: {
      // Disable overly strict rules
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      'arrow-body-style': 'off',
      // React specific
      'react/react-in-jsx-scope': 'off'
    }
  }
];
