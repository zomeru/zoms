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
├── tailwind.config.js   # Tailwind CSS v4 configuration
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.json       # ESLint configuration
└── .prettierrc          # Prettier configuration
```

## Source Code Organization (`src/`)

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx       # Root layout with font, metadata, global styles
│   ├── page.tsx         # Home page component
│   ├── not-found.tsx    # 404 page
│   ├── blog/            # Blog pages
│   │   ├── page.tsx     # Blog listing page
│   │   ├── BlogListClient.tsx   # Client-side blog list
│   │   ├── BlogGenerateButton.tsx  # AI generation button
│   │   ├── GenerateBlogModal.tsx   # Modal for blog generation
│   │   └── [slug]/      # Dynamic blog post pages
│   │       ├── page.tsx # Blog post page
│   │       └── BlogContent.tsx  # Blog post content renderer
│   └── api/             # API routes
│       └── blog/        # Blog API endpoints
│           ├── route.ts # Blog CRUD operations
│           ├── generate/route.ts  # AI blog generation
│           └── [slug]/route.ts    # Single post operations
├── components/          # Reusable UI components
│   ├── index.ts         # Barrel exports
│   ├── MainInfo.tsx     # Left sidebar with name, title, navigation
│   ├── MouseFollower.tsx # Interactive mouse follower effect
│   ├── DogeModal.tsx    # Modal component
│   ├── Footer.tsx       # Footer component
│   ├── Navigation.tsx   # Navigation menu
│   ├── Socials.tsx      # Social media links
│   ├── Portal/          # Portal component for modals
│   └── Sections/        # Main content sections
│       ├── index.ts     # Barrel exports
│       ├── About.tsx    # About section
│       ├── Blog.tsx     # Blog section (latest posts)
│       ├── Experience.tsx # Work experience section (Sanity-powered)
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
│   └── other.ts         # Other miscellaneous constants
├── lib/                 # Utilities and services
│   ├── blog.ts          # Blog data fetching functions
│   ├── experience.ts    # Experience data fetching functions
│   ├── generateBlog.ts  # AI blog generation logic
│   ├── generateBlogHelpers.ts  # Helper functions for blog generation
│   ├── sanity.ts        # Sanity client configuration
│   └── utils.ts         # General utility functions
└── styles/              # Global styles
    └── globals.css      # Tailwind imports and custom CSS
```

## Studio Directory (`studio/`)

```
studio/
├── schemas/             # Sanity schema definitions
│   ├── index.ts         # Schema exports
│   ├── blogPost.ts      # Blog post schema
│   ├── experience.ts    # Experience schema
│   ├── blockContent.ts  # Rich text schema
│   └── blogPostBlockContent.ts  # Blog-specific rich text
├── sanity.config.ts     # Sanity studio configuration
├── config.ts            # Studio-specific config
├── sanity.cli.ts        # CLI configuration
└── package.json         # Studio dependencies
```

## Key Architectural Patterns

### Layout Structure

- **Two-column layout**: Fixed left sidebar (`MainInfo`) + scrollable right content
- **Responsive design**: Stacks vertically on mobile, side-by-side on desktop
- **Fixed positioning**: Left sidebar stays in place while right content scrolls

### Component Hierarchy

```
RootLayout
├── MouseFollower (global interactive element)
└── Home Page
    ├── MainInfo (left sidebar)
    │   ├── Navigation
    │   └── Socials
    └── Content Sections (right side)
        ├── About
        ├── TechStack
        ├── Experience (Sanity-powered)
        ├── Projects
        ├── Blog (latest posts)
        ├── Footer
        └── DogeModal
```

### Data Flow

- **Static content**: Stored in `constants/` files as TypeScript objects
- **Dynamic content**: Experience and blog data fetched from Sanity CMS
- **Configuration-driven**: SEO, colors, and app settings in `configs/`
- **AI Generation**: Automated blog creation with topic rotation and Gemini AI
- **ISR Pattern**: 60-second revalidation for dynamic content

### Import Strategy

- **Barrel exports**: Clean imports via `index.ts` files
- **Path aliases**: `@/` prefix for all src/ imports
- **Default exports**: Components use default exports with named barrel re-exports

### Content Management

- **Hybrid approach**: Static constants for stable content, Sanity CMS for dynamic content
- **Fallback strategy**: Constants provide fallback data if Sanity is unavailable
- **Schema-driven**: TypeScript interfaces match Sanity schemas for type safety
