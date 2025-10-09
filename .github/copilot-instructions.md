# GitHub Copilot Instructions - Zoms Portfolio & AI Blog

This file provides guidance for AI assistants (including GitHub Copilot) when working on this codebase.

## Project Overview

**Zoms** is a modern personal portfolio website with AI-powered blog generation built using Next.js 15 App Router, React 19, TypeScript (strict mode), TailwindCSS v4, Sanity CMS, and Google Gemini AI.

## Architecture & Tech Stack

### Core Technologies

- **Next.js 15** (App Router) with React 19
- **TypeScript 5.9** (strict mode)
- **TailwindCSS v4** with modern `@theme` directive
- **Sanity CMS** for content management
- **Google Gemini AI** for blog generation
- **Upstash Redis** for rate limiting (with in-memory fallback)

### Key Libraries

- **Zod** for schema validation
- **Unified/Remark/Rehype** for markdown processing
- **React Hot Toast** for notifications
- **Vercel Analytics** for performance monitoring

## Code Conventions & Patterns

### TypeScript Guidelines

- **Strict mode enabled** - no implicit any, explicit return types where beneficial
- **Path aliases** - use `@/` for `src/` imports
- **Component props** - define interfaces for all component props
- **API responses** - use Zod schemas for validation

### Component Architecture

```typescript
// Server component by default
export default function ServerComponent() {
  return <div>Server rendered content</div>
}

// Client component only when needed
'use client'
export default function ClientComponent() {
  const [state, setState] = useState()
  return <div>Interactive content</div>
}
```

### API Route Pattern

```typescript
import { NextResponse, type NextRequest } from 'next/server';

import { validateSchema, withErrorHandling } from '@/lib/errorHandler';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { someSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  // Apply rate limiting first
  const rateLimitResponse = await rateLimitMiddleware(request, 'DEFAULT');
  if (rateLimitResponse) return rateLimitResponse;

  return withErrorHandling(
    async () => {
      const body = await request.json();
      const validatedData = validateSchema(someSchema, body);

      // Business logic here

      return NextResponse.json({ success: true, data: validatedData });
    },
    { method: 'POST', path: '/api/endpoint' }
  );
}
```

### Error Handling

- Use `ApiError` class for structured API errors
- Wrap API route logic with `withErrorHandling`
- Validate inputs with Zod schemas via `validateSchema`
- Environment-aware error messages (detailed in dev, sanitized in prod)

### Logging

```typescript
import log from '@/lib/logger';

// Use structured logging instead of console
log.info('Operation completed', { userId, operation: 'blog-generate' });
log.error('Operation failed', { error: error.message, context });
log.timeAsync('Database query', async () => await dbQuery());
```

## Important Patterns

### Data Fetching

- **Server components** - fetch data directly in component
- **ISR enabled** - all Sanity queries use `revalidate: 60`
- **Client fetching** - only when user interaction required

### Rate Limiting

- Apply `rateLimitMiddleware` to write/compute-heavy endpoints
- Different configs: `BLOG_GENERATE` (5/min), `BLOG_API` (100/min), `DEFAULT` (60/min)

### Environment Variables

- All secrets in `.env.local` (never commit)
- Use `.env.example` as template
- Access via `process.env.VARIABLE_NAME`

## AI Blog Generation

### Contract

The `generateBlogContent()` function must return:

```typescript
interface GeneratedBlogPost {
  title: string; // truncated to MAX_TITLE_LENGTH
  summary: string; // truncated to MAX_SUMMARY_LENGTH
  body: string; // raw markdown content
  tags: string[]; // 3-5 relevant tags
  readTime: number; // estimated read time in minutes
}
```

### Key Files

- `src/lib/generateBlog.ts` - Main generation logic
- `src/lib/generateBlogHelpers.ts` - JSON parsing utilities
- `src/constants/topics.ts` - Topic selection for AI prompts

## File Organization

### Core Utilities (`src/lib/`)

- `blog.ts` - Blog data fetching with ISR
- `errorHandler.ts` - Centralized error handling
- `logger.ts` - Structured logging with PII sanitization
- `rateLimit.ts` - Rate limiting (Redis + in-memory fallback)
- `sanity.ts` - Sanity CMS client
- `schemas.ts` - Zod validation schemas

### API Routes (`src/app/api/`)

- `blog/route.ts` - GET paginated blog list
- `blog/[slug]/route.ts` - GET single blog post
- `blog/generate/route.ts` - POST AI blog generation

## Development Guidelines

### Code Quality

- Run `pnpm test-all` before committing (format + lint + types)
- Use `pnpm dev` for development server
- Use `pnpm studio:dev` for Sanity Studio

### Security

- Never log secrets or PII (logger auto-sanitizes)
- Validate all API inputs with Zod schemas
- Apply rate limiting to public endpoints
- Use environment-aware error responses

### Performance

- Prefer server components over client components
- Use ISR (60s) for dynamic content
- Minimize client-side JavaScript
- Leverage Next.js automatic optimizations

## Common Tasks

### Adding New API Endpoint

1. Create route file in `src/app/api/`
2. Add rate limiting via `rateLimitMiddleware`
3. Define Zod schema in `src/lib/schemas.ts`
4. Use `withErrorHandling` wrapper
5. Add structured logging

### Adding New Component

1. Determine if server or client component needed
2. Add `'use client'` only if interactive
3. Define TypeScript interfaces for props
4. Use Tailwind classes for styling
5. Follow naming conventions (PascalCase)

### Environment Variables

1. Add to `.env.example` with description
2. Document in README.md
3. Access via `process.env.VARIABLE_NAME`
4. Never log raw values

## Dependencies & Updates

### Adding Dependencies

- Prefer lightweight, well-maintained packages
- Check bundle size impact
- Ensure TypeScript compatibility
- Update package.json and pnpm-lock.yaml

### Package Management

- Use `pnpm` as package manager
- Pin major versions for stability
- Regular security updates via `pnpm audit`

## Testing & Quality

### Pre-commit Hooks

- Husky runs ESLint + Prettier on staged files
- Ensure `pnpm test-all` passes before push
- TypeScript strict mode must pass

### Manual Testing

- Test in development mode (`pnpm dev`)
- Verify API endpoints with proper error handling
- Check responsive design across devices
- Test environment variable configurations

## Performance Monitoring

### Observability

- Structured logging in production
- Vercel Analytics for user metrics
- ISR cache performance monitoring
- Error tracking via centralized handler

### Optimization

- Server-side rendering by default
- Incremental Static Regeneration (60s)
- Automatic image optimization
- Bundle size monitoring

## Security Considerations

### Data Protection

- PII sanitization in logs
- Input validation with Zod
- Rate limiting on public endpoints
- Environment-aware error messages

### API Security

- Request validation
- Response sanitization
- Proper error handling
- Authentication for sensitive operations

---

When working on this codebase, always prioritize type safety, performance, and security. Follow the established patterns and conventions to maintain code quality and consistency.
