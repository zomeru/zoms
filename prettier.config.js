/** @type {import('prettier').Config} */
const config = {
  trailingComma: 'none',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  useTabs: false,
  bracketSpacing: true,
  endOfLine: 'auto',
  printWidth: 100,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
    '^react$',
    '^next',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@/components/(.*)$',
    '^@/configs/(.*)$',
    '^@/constants/(.*)$',
    '^@/(.*)$',
    '',
    '^[./]'
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.0.0',
  importOrderCaseSensitive: false
};

module.exports = config;
