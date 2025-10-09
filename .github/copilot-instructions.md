# Copilot Instructions for Zoms Portfolio

## Project Overview

This is a modern Next.js 15 portfolio website for Zomer Gregorio using TypeScript, TailwindCSS v4, and the App Router. The site features a dark theme with purple accents, a two-column responsive layout, dynamic blog system powered by Sanity CMS and AI content generation, plus enterprise-grade features including rate limiting, structured logging, and comprehensive error handling.

## Architecture & Key Patterns

### Layout Structure

- **Two-column design**: Fixed left sidebar (`MainInfo`) with scrollable right content sections
- **Responsive breakpoints**: Mobile stacks vertically, desktop side-by-side using `lg:` prefix
- **App Router**: Uses `src/app/` directory with `layout.tsx` and `page.tsx`
- **Dynamic routing**: Blog system with `/blog` and `/blog/[slug]` pages

### Component Organization

```
src/components/
├── index.ts           # Barrel exports for clean imports
├── MainInfo.tsx       # Left sidebar (name, title, navigation, socials)
├── Sections/          # Right-side content sections
│   ├── About.tsx
│   ├── TechStack.tsx
│   ├── Experience.tsx # Sanity CMS powered with fallback
│   ├── Projects.tsx
│   └── Blog.tsx       # Latest blog posts section
```

### Content Management Strategy

- **Static Content**: Projects, tech stack, personal info in `src/constants/`
- **Dynamic Content**: Experience and blog posts managed via Sanity CMS
- **AI Content**: Automated blog generation using Google Gemini AI with topic rotation
- **Hybrid Approach**: Fallback to constants if Sanity unavailable

### Data Management

- **Constants-driven static content**: Portfolio data in `src/constants/` (projects.ts, other.ts)
- **Sanity CMS dynamic content**: Experience and blog posts with ISR
- **Configuration-based SEO**: Comprehensive metadata in `src/configs/seo.ts`
- **Path aliases**: Use `@/` for all src/ imports (configured in tsconfig.json)

### Enterprise Features

- **Rate Limiting**: Upstash Redis with in-memory fallback (`src/lib/rateLimit.ts`)
- **Structured Logging**: Edge Runtime-compatible logger with PII sanitization (`src/lib/logger.ts`)
- **Error Handling**: Centralized error management with environment-aware responses (`src/lib/errorHandler.ts`)
- **Input Validation**: Zod schemas for type-safe API validation (`src/lib/schemas.ts`)

## Development Workflow

### Essential Commands

```bash
pnpm dev                 # Frontend development server
pnpm studio:dev          # Sanity Studio (localhost:3333)
pnpm test-all            # Format + lint + type check
pnpm test-all:build      # Full validation + build test
```

### Content Management Commands

```bash
pnpm studio:dev          # Start Sanity Studio locally
pnpm studio:build        # Build studio for deployment
pnpm studio:deploy       # Deploy studio to Sanity hosting
```

### Pre-commit Automation (Husky)

- **Automatic**: ESLint auto-fix + Prettier formatting on staged files
- **Type checking**: TypeScript validation before commit
- **Commit blocked** if any checks fail

## Code Style & Conventions

### TypeScript Patterns

- **Component types**: Always use `React.JSX.Element` return type
- **Strict config**: No implicit returns, unreachable code, or fallthrough cases
- **Props destructuring**: In function parameters with explicit typing
- **Interface definitions**: Sanity schema types in lib files
- **API validation**: Use Zod schemas for all API inputs/outputs

### Styling with TailwindCSS v4

- **Modern approach**: No `tailwind.config.js` file, uses `@theme` directive in `globals.css`
- **CSS variables**: Semantic color names (`backgroundPrimary`, `textSecondary`, `primary`)
- **Custom utilities**: Define with `@utility` in `globals.css`
- **Responsive utilities**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Layout patterns**: `max-w-[1300px] mx-auto` for containers

### Import/Export Conventions

- **Barrel exports**: Components exported via `index.ts` files
- **Default exports**: Components use default, utilities use named exports
- **Import order**: External packages, then internal with `@/` alias

### Error Handling Patterns

```typescript
// API routes with comprehensive error handling
import { handleApiError, validateSchema } from '@/lib/errorHandler';
import log from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(request, 'BLOG_API');
    if (rateLimitResult) return rateLimitResult;

    // Input validation
    const body = await request.json();
    const validatedData = validateSchema(requestSchema, body);

    // Business logic with logging
    log.info('API request processed', { method: 'POST', path: '/api/example' });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { method: 'POST', path: '/api/example' });
  }
}
```

## Key Integration Points

### TailwindCSS v4 Implementation

- **Configuration**: Uses `@theme` directive in `src/styles/globals.css`
- **Custom colors**: Defined as CSS variables (e.g., `--color-primary: #ad5aff`)
- **Custom utilities**: Use `@utility` directive for reusable components
- **No config file**: Modern approach eliminates need for `tailwind.config.js`

### Sanity CMS Integration

- **Client configuration**: `src/lib/sanity.ts` with environment-based settings
- **Data fetching**: ISR with 60-second revalidation for all Sanity content
- **Schema definitions**: Located in `studio/schemas/` directory
- **Fallback strategy**: Constants provide backup data if Sanity unavailable

### Blog System Architecture

- **Dynamic routing**: `/blog` for listing, `/blog/[slug]` for individual posts
- **AI generation**: Google Gemini API for automated content creation
- **Topic rotation**: Curated topics in `src/constants/topics.ts`
- **Markdown rendering**: Direct react-markdown with GitHub-flavored markdown support
- **Code highlighting**: React Syntax Highlighter for beautiful code blocks
- **API routes**: CRUD operations in `src/app/api/blog/` with validation and rate limiting
- **Simplified architecture**: Raw markdown storage with client-side rendering (400+ lines of preprocessing removed)

### Rate Limiting & Security

- **Multiple backends**: Upstash Redis (production) with in-memory fallback (development)
- **Configurable limits**: Different limits for different endpoints
- **Graceful degradation**: Falls back to in-memory if Redis unavailable
- **Logging integration**: All rate limit events logged with context

### Logging & Monitoring

- **Environment-aware**: Pretty logs for development, JSON for production
- **PII protection**: Automatic sanitization of sensitive data
- **Edge Runtime compatible**: Works in serverless and edge environments
- **Structured output**: Consistent format for log aggregation

## Content Management Workflows

### Static Content Updates

- **Projects**: Modify `src/constants/projects.ts`
- **Tech Stack**: Update `src/constants/other.ts`
- **Personal Info**: Edit constants in `src/constants/other.ts`
- **Blog Topics**: Manage AI generation topics in `src/constants/topics.ts`

### Dynamic Content Updates

- **Experience**: Use Sanity Studio at `localhost:3333` or production studio
- **Blog Posts**: Manual creation in Studio or AI generation via blog page
- **Schema Changes**: Modify schemas in `studio/schemas/` and redeploy

### AI Blog Generation

- **Manual Trigger**: Use "Generate Blog with AI" button on `/blog` page
- **Automatic Process**: Topic selection, Gemini AI generation, Sanity publishing
- **Content Quality**: AI generates technical content with code examples and structured format
- **Rate Limited**: Strict rate limiting prevents abuse

## Common Tasks

### Adding New Components

1. Create in appropriate directory (`components/` or `components/Sections/`)
2. Use PascalCase naming with TypeScript
3. Add to barrel export in `index.ts`
4. Import using `@/components` alias

### Adding Custom TailwindCSS v4 Utilities

Add to `src/styles/globals.css`:

```css
@utility my-custom-utility {
  /* CSS properties */
  color: var(--color-primary);
  transition: all 300ms ease;

  &:hover {
    color: var(--color-secondary);
  }
}
```

### API Route Development

1. Create route handler in `src/app/api/`
2. Add Zod schema validation in `src/lib/schemas.ts`
3. Implement rate limiting with appropriate config
4. Use centralized error handling
5. Add structured logging for monitoring

### Modifying Layout

- **Sidebar content**: Edit `MainInfo.tsx` and child components
- **Content sections**: Add/modify in `src/components/Sections/`
- **Responsive behavior**: Use Tailwind's `lg:` prefix for desktop-specific styles

### Blog System Modifications

- **Blog schemas**: Edit `studio/schemas/blogPost.ts` for data structure
- **Content rendering**: Modify `BlogContent.tsx` for display customization (uses react-markdown)
- **AI prompts**: Update generation logic in `src/lib/generateBlog.ts`
- **Topic management**: Add/remove topics in `src/constants/topics.ts`
- **Markdown processing**: Direct react-markdown rendering (no preprocessing pipeline)

### Sanity Schema Updates

1. Modify schema files in `studio/schemas/`
2. Test locally with `pnpm studio:dev`
3. Deploy with `pnpm studio:deploy`
4. Update TypeScript interfaces in `src/lib/` files

### Performance Optimization

- **ISR configuration**: Modify revalidation times in data fetching functions
- **Image optimization**: Use Next.js Image component for media
- **Bundle analysis**: Monitor build output and dependency sizes
- **Cache strategies**: Leverage Sanity CDN and Next.js static generation

### Deployment Preparation

- **Build validation**: `pnpm test-all:build` must pass
- **Environment variables**: Ensure all required credentials are set
- **Studio deployment**: Deploy Sanity Studio separately
- **Sitemap verification**: Check generated files in `public/` after build

## Environment Variables Management

### Required Variables

- `NEXT_PUBLIC_SANITY_PROJECT_ID`: Sanity project identifier
- `NEXT_PUBLIC_SANITY_DATASET`: Usually 'production'
- `SANITY_API_TOKEN`: Write token for content operations

### Optional Variables

- `GEMINI_API_KEY`: For AI blog generation
- `UPSTASH_REDIS_REST_URL`: Redis URL for production rate limiting
- `UPSTASH_REDIS_REST_TOKEN`: Redis authentication token
- `LOG_LEVEL`: Logging level (trace, debug, info, warn, error, fatal)
- `NEXLOG_STRUCTURED`: Enable JSON structured logging (true/false)
- `SITE_URL`: Custom domain (auto-detected otherwise)

### Development vs Production

- **Development**: Uses local studio, in-memory rate limiting, pretty logs
- **Production**: Uses production Sanity dataset, Redis rate limiting, structured logs
- **Studio**: Separate deployment with environment variable inheritance

### Error Handling Configuration

- **Development**: Detailed error messages with stack traces
- **Production**: Sanitized error messages, no sensitive data exposure
- **Logging**: All errors logged with context for debugging
