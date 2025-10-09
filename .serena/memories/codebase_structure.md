# Codebase Structure

## Root Directory Structure

```
/
├── .github/              # GitHub configuration (dependabot, copilot instructions)
├── .husky/              # Git hooks (pre-commit validation)
├── public/              # Static assets, manifests, sitemaps
├── src/                 # Frontend source code
├── studio/              # Sanity CMS workspace
├── package.json         # Dependencies and scripts
├── next.config.js       # Next.js configuration with redirects
├── postcss.config.mjs   # PostCSS configuration for TailwindCSS v4
├── tsconfig.json        # TypeScript configuration
├── eslint.config.mjs    # ESLint configuration
└── prettier.config.js   # Prettier configuration
```

## Source Code Organization (`src/`)

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx       # Root layout with font, metadata, global styles
│   ├── page.tsx         # Home page component
│   ├── not-found.tsx    # 404 page
│   ├── blog/            # Blog pages and components
│   │   ├── page.tsx     # Blog listing page with pagination
│   │   ├── BlogListClient.tsx      # Client-side blog list with pagination
│   │   ├── BlogGenerateButton.tsx  # AI generation button with toast
│   │   ├── GenerateBlogModal.tsx   # Modal for AI blog generation
│   │   └── [slug]/      # Dynamic blog post pages
│   │       ├── page.tsx # Blog post page with metadata
│   │       └── BlogContent.tsx     # react-markdown content renderer
│   └── api/             # API routes with validation and error handling
│       └── blog/        # Blog API endpoints
│           ├── route.ts # Blog CRUD operations with pagination
│           ├── generate/route.ts   # AI blog generation endpoint
│           └── [slug]/route.ts     # Single post operations
├── components/          # Reusable UI components
│   ├── index.ts         # Barrel exports
│   ├── MainInfo.tsx     # Left sidebar (name, title, navigation, socials)
│   ├── MouseFollower.tsx # Interactive mouse follower effect
│   ├── DogeModal.tsx    # Easter egg modal component
│   ├── Footer.tsx       # Footer component
│   ├── Navigation.tsx   # Navigation menu with active states
│   ├── Socials.tsx      # Social media links
│   ├── Portal/          # Portal component for modals
│   │   ├── index.tsx    # Portal implementation
│   │   └── index.css    # Portal-specific styles
│   └── Sections/        # Main content sections
│       ├── index.ts     # Barrel exports
│       ├── About.tsx    # About section
│       ├── Blog.tsx     # Blog section (latest posts preview)
│       ├── Experience.tsx # Work experience (Sanity-powered with fallback)
│       ├── Projects.tsx # Projects showcase section
│       └── TechStack.tsx # Technology stack section
├── configs/             # Application configuration
│   ├── index.ts         # Barrel exports
│   └── seo.ts           # SEO metadata and OpenGraph config
├── constants/           # Static data and content
│   ├── index.ts         # Barrel exports
│   ├── experience.ts    # Fallback experience data
│   ├── projects.ts      # Project portfolio data
│   ├── topics.ts        # Blog topic rotation for AI generation
│   └── other.ts         # Personal info and miscellaneous constants
├── lib/                 # Utilities and services
│   ├── blog.ts          # Blog data fetching with ISR
│   ├── experience.ts    # Experience data fetching with fallback
│   ├── generateBlog.ts  # AI blog generation logic
│   ├── generateBlogHelpers.ts  # Helper functions for blog generation
│   ├── sanity.ts        # Sanity client configuration
│   ├── utils.ts         # General utility functions
│   ├── schemas.ts       # Zod schemas for API validation
│   ├── errorHandler.ts  # Centralized error handling utilities
│   ├── errorMessages.ts # Error message definitions
│   ├── rateLimit.ts     # Rate limiting with Redis/in-memory fallback
│   └── logger.ts        # Edge Runtime-compatible structured logging
└── styles/              # Global styles
    └── globals.css      # TailwindCSS v4 imports, theme, and custom utilities
```

## Studio Directory (`studio/`)

```
studio/
├── schemas/             # Sanity schema definitions
│   ├── index.ts         # Schema exports
│   ├── blogPost.ts      # Blog post schema with markdown support
│   ├── experience.ts    # Experience schema
│   └── blockContent.ts  # Rich text schema for general content
├── sanity.config.ts     # Sanity studio configuration
├── config.ts            # Studio-specific configuration
├── sanity.cli.ts        # CLI configuration
└── package.json         # Studio dependencies and scripts
```

## Key Architectural Patterns

### App Router Structure

```
app/
├── layout.tsx                    # Root layout with metadata
├── page.tsx                      # Home page (all sections)
├── not-found.tsx                 # 404 error page
├── blog/
│   ├── page.tsx                  # Blog listing with AI generation
│   ├── BlogListClient.tsx        # Client-side pagination
│   ├── BlogGenerateButton.tsx    # AI generation UI
│   ├── GenerateBlogModal.tsx     # Generation modal
│   └── [slug]/
│       ├── page.tsx              # Individual blog post
│       └── BlogContent.tsx       # react-markdown renderer
└── api/
    └── blog/
        ├── route.ts              # GET /api/blog (list posts)
        ├── generate/route.ts     # POST /api/blog/generate (AI)
        └── [slug]/route.ts       # GET /api/blog/[slug] (single post)
```

### Component Hierarchy

```
RootLayout
├── Inter Font Loading
├── Metadata Configuration
├── Analytics Components
└── Home Page
    ├── MainInfo (fixed sidebar)
    │   ├── Personal Info
    │   ├── Navigation
    │   └── Socials
    ├── MouseFollower (global interactive element)
    └── Content Sections (scrollable)
        ├── About
        ├── TechStack
        ├── Experience (Sanity + fallback)
        ├── Projects
        ├── Blog (latest posts)
        ├── Footer
        └── DogeModal (easter egg)
```

### Data Flow Architecture

```
Static Content Flow:
constants/ → components → pages

Dynamic Content Flow:
Sanity CMS → lib/fetchers → ISR → components → pages

AI Generation Flow:
UI trigger → API route → Gemini AI → Sanity CMS → ISR → UI update

Blog Content Flow (Simplified):
AI/Manual → Raw Markdown → Sanity Storage → react-markdown Render

Error Handling Flow:
API error → errorHandler → logger → sanitized response

Rate Limiting Flow:
Request → rateLimit middleware → Redis/memory → allow/deny
```

### API Route Structure

```
/api/blog/
├── route.ts (GET)
│   ├── Query validation (Zod)
│   ├── Rate limiting
│   ├── Data fetching
│   ├── Pagination
│   └── Error handling
├── generate/route.ts (POST)
│   ├── Authentication check
│   ├── Strict rate limiting
│   ├── AI generation
│   ├── Sanity publishing
│   └── Response validation
└── [slug]/route.ts (GET)
    ├── Slug validation
    ├── Single post fetch
    ├── 404 handling
    └── Structured response
```

### Validation & Error Handling

```
Request Validation:
Raw Request → Zod Schema → Validated Data → Business Logic

Error Handling:
Error → Error Handler → Environment Check → Sanitized Response

Logging:
Event → Logger → PII Sanitization → Structured Output → Console/External
```

### Import Strategy

- **Barrel exports**: Clean imports via `index.ts` files in directories
- **Path aliases**: `@/` prefix for all src/ imports (configured in tsconfig.json)
- **Default exports**: Components use default exports with named barrel re-exports
- **Type-only imports**: Use `import type` for TypeScript-only imports

### Content Management Strategy

```
Static Content:
- Projects: constants/projects.ts
- Tech Stack: constants/other.ts
- Personal Info: constants/other.ts
- Blog Topics: constants/topics.ts

Dynamic Content:
- Experience: Sanity CMS → lib/experience.ts → fallback to constants
- Blog Posts: Sanity CMS → lib/blog.ts → ISR caching

AI Content:
- Topics: constants/topics.ts
- Generation: lib/generateBlog.ts
- Publishing: Direct Sanity API calls with raw markdown storage
```

### Styling Architecture

```
TailwindCSS v4:
globals.css
├── @import 'tailwindcss'
├── @theme (CSS variables)
├── @utility (custom utilities)
└── @keyframes (custom animations)

Component Styling:
- Utility classes for layout and responsive design
- Custom utilities for consistent interactive elements
- CSS variables for theming
- No separate config file needed
```

### Development vs Production Differences

```
Development:
- Detailed error messages
- Debug logging
- In-memory rate limiting
- Local Sanity dataset
- Pretty console logging

Production:
- Sanitized error messages
- Info+ level logging
- Redis rate limiting
- Production Sanity dataset
- Structured JSON logging
```

### Type Safety Architecture

```
Schema Definition:
Sanity Schemas → TypeScript Interfaces → Zod Schemas → API Validation

Component Props:
TypeScript Interfaces → Component Props → Runtime Validation

API Contracts:
Zod Schemas → Request/Response Types → Runtime Validation
```

## Recent Changes (October 2025)

### Markdown Architecture Simplification

- **Removed**: `src/lib/markdownProcessor.ts` - unified.js preprocessing pipeline
- **Added**: Direct react-markdown rendering in `BlogContent.tsx`
- **Simplified**: Blog content storage to raw markdown format
- **Benefits**: 400+ lines of code removed, better performance, simpler maintenance

### Blog Content Flow (Current)

```
AI Generation → Raw Markdown → Sanity Storage → react-markdown → Styled Output
```

**Key Components:**
- `react-markdown`: GitHub-flavored markdown rendering
- `React Syntax Highlighter`: Code block highlighting
- Custom prose styles: Dark theme integration
- GFM plugins: Tables, task lists, strikethrough support