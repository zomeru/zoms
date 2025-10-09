# Codebase Structure

## Root Directory Structure

```
zoms/
├── .github/                 # GitHub configuration and workflows
├── .husky/                  # Git hooks configuration
├── .next/                   # Next.js build output (auto-generated)
├── .serena/                 # Serena AI assistant configuration
├── node_modules/            # Dependencies (auto-generated)
├── public/                  # Static assets and files
├── src/                     # Main application source code
├── studio/                  # Sanity CMS configuration
├── .env.example             # Environment variables template
├── .env.local               # Local environment variables (not in git)
├── .gitignore               # Git ignore rules
├── eslint.config.mjs        # ESLint configuration
├── next.config.js           # Next.js configuration
├── package.json             # Project dependencies and scripts
├── prettier.config.js       # Prettier configuration
├── README.md                # Project documentation
└── tsconfig.json            # TypeScript configuration
```

## Source Code Structure (src/)

```
src/
├── app/                     # Next.js App Router
│   ├── api/                 # API routes
│   │   └── blog/            # Blog-related API endpoints
│   ├── blog/                # Blog pages and components
│   ├── layout.tsx           # Root layout component
│   ├── not-found.tsx        # 404 page
│   └── page.tsx             # Home page
├── components/              # Reusable React components
├── configs/                 # Application configuration
├── constants/               # Static data and constants
├── lib/                     # Utility functions and helpers
└── styles/                  # Global styles and CSS
```

## Key Directories Explained

### `/src/app/api/blog/`

- `route.ts` - GET /api/blog (paginated blog list)
- `generate/route.ts` - GET/POST /api/blog/generate (AI blog generation)
- `[slug]/route.ts` - GET /api/blog/[slug] (single blog post)

### `/src/lib/`

Core utility modules:

- `blog.ts` - Blog data fetching functions
- `errorHandler.ts` - Centralized error handling
- `generateBlog.ts` - AI blog generation logic
- `generateBlogHelpers.ts` - JSON parsing utilities
- `logger.ts` - Structured logging system
- `rateLimit.ts` - Rate limiting implementation
- `sanity.ts` - Sanity CMS client configuration
- `schemas.ts` - Zod validation schemas
- `unified.ts` - Markdown processing pipeline
- `utils.ts` - General utility functions

### `/src/constants/`

Static data files for content that doesn't need CMS management

### `/src/components/`

Reusable UI components organized by feature/section

### `/studio/`

Sanity CMS configuration:

- `schemas/` - Content type definitions
- `sanity.config.ts` - Studio configuration

## Architecture Patterns

### API Routes

- All routes use centralized error handling
- Rate limiting applied based on endpoint type
- Zod validation for request/response data
- Structured logging for observability

### Data Flow

1. **Static Content** → TypeScript constants in `/src/constants/`
2. **Dynamic Content** → Sanity CMS with ISR (60s revalidation)
3. **AI Content** → Generated via Gemini API and stored in Sanity
4. **Client Rendering** → Server components by default, client only when needed

### Component Architecture

- Server components for data fetching and static content
- Client components marked with `'use client'` for interactivity
- Shared utilities in `/src/lib/` for reuse across components and API routes
