# Task Completion Checklist

## Before Committing Changes

1. **Format Code**: `npm run format` (or let pre-commit hook handle it)
2. **Check Linting**: `npm run check-lint`
3. **Type Check**: `npm run check-types`
4. **Run All Checks**: `npm run test-all`

## For New Components

1. Create component file in appropriate directory (`src/components/` or `src/components/Sections/`)
2. Use TypeScript with explicit return type `React.JSX.Element`
3. Add to barrel export in `index.ts` if needed
4. Follow naming conventions (PascalCase)
5. Import and integrate into parent components

## For New Features

1. **Test locally**: `pnpm dev` and verify functionality
2. **Build test**: `npm run test-all:build` to ensure production build works
3. **Check responsiveness**: Test on different screen sizes
4. **Verify accessibility**: Check keyboard navigation and screen reader compatibility

## For Content Updates

1. **Update constants**: Modify files in `src/constants/` (experience.ts, projects.ts, other.ts)
2. **Update SEO**: Modify `src/configs/seo.ts` if metadata changes needed
3. **Test sitemap**: Ensure `next-sitemap` generates correctly after build

## Pre-Deployment

1. **Environment check**: Verify SITE_URL environment variable
2. **Build verification**: `npm run build` should complete without errors
3. **Sitemap generation**: Confirm sitemap files are created in public/
4. **SEO validation**: Check meta tags and OpenGraph data

## Git Workflow (Automatic via Husky)

- Pre-commit hook automatically runs:
  - ESLint with auto-fix on staged files
  - Prettier formatting on staged files
  - TypeScript type checking
- Commit will be blocked if any checks fail

## Post-Deployment Verification

1. **Check live site**: Verify deployment at production URL
2. **Test redirects**: Confirm social media redirects work (/github, /linkedin, etc.)
3. **SEO check**: Validate metadata and sitemap accessibility
