# Copilot Instructions for Zoms Portfolio

## Project Overview

This is a modern Next.js 15 portfolio website for Zomer Gregorio using TypeScript, TailwindCSS v4, and the App Router. The site features a dark theme with purple accents, a two-column responsive layout, and a dynamic blog system powered by Sanity CMS and AI content generation.

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
│   ├── Experience.tsx # Sanity CMS powered
│   ├── Projects.tsx
│   └── Blog.tsx       # Latest blog posts section
```

### Content Management Strategy

- **Static Content**: Projects, tech stack, personal info in `src/constants/`
- **Dynamic Content**: Experience and blog posts managed via Sanity CMS
- **AI Content**: Automated blog generation using Google Gemini AI
- **Hybrid Approach**: Fallback to constants if Sanity unavailable

### Data Management

- **Constants-driven static content**: Portfolio data in `src/constants/` (projects.ts, other.ts)
- **Sanity CMS dynamic content**: Experience and blog posts with ISR
- **Configuration-based SEO**: Comprehensive metadata in `src/configs/seo.ts`
- **Path aliases**: Use `@/` for all src/ imports (configured in tsconfig.json)

## Development Workflow

### Essential Commands

```bash
npm install -g pnpm@latest-10 # Install pnpm globally
pnpm install             # Install dependencies
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

### Styling with TailwindCSS v4

- **Custom colors**: Use semantic names (`backgroundPrimary`, `textSecondary`, `primary`)
- **Responsive utilities**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Layout patterns**: `max-w-[1300px] mx-auto` for containers, `lg:w-[550px]` for sidebar

### Import/Export Conventions

- **Barrel exports**: Components exported via `index.ts` files
- **Default exports**: Components use default, utilities use named exports
- **Import order**: External packages, then internal with `@/` alias

## Key Integration Points

### Sanity CMS Integration

- **Client configuration**: `src/lib/sanity.ts` with environment-based settings
- **Data fetching**: ISR with 60-second revalidation for all Sanity content
- **Schema definitions**: Located in `studio/schemas/` directory
- **Fallback strategy**: Constants provide backup data if Sanity unavailable

### Blog System Architecture

- **Dynamic routing**: `/blog` for listing, `/blog/[slug]` for individual posts
- **AI generation**: Google Gemini API for automated content creation
- **Topic rotation**: Curated topics in `src/constants/topics.ts`
- **Rich content**: Portable Text with React Syntax Highlighter for code blocks
- **API routes**: CRUD operations in `src/app/api/blog/`

### SEO & Metadata

- **Environment-based URLs**: Production vs development domains in `src/configs/seo.ts`
- **Comprehensive metadata**: OpenGraph, Twitter cards, manifest, icons
- **Sitemap generation**: Automatic via `next-sitemap` after build
- **ISR considerations**: Dynamic content revalidation for SEO

### Social Media Redirects

- **Next.js redirects**: Configured in `next.config.js` for `/github`, `/linkedin`, etc.
- **Permanent redirects**: All social links use `permanent: true`

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

- **Manual Trigger**: Use "Generate New Post" button on `/blog` page
- **Automatic Process**: Topic selection, Gemini AI generation, Sanity publishing
- **Content Quality**: AI generates technical content with code examples and structured format

## Common Tasks

### Adding New Components

1. Create in appropriate directory (`components/` or `components/Sections/`)
2. Use PascalCase naming with TypeScript
3. Add to barrel export in `index.ts`
4. Import using `@/components` alias

### Modifying Layout

- **Sidebar content**: Edit `MainInfo.tsx` and child components
- **Content sections**: Add/modify in `src/components/Sections/`
- **Responsive behavior**: Use Tailwind's `lg:` prefix for desktop-specific styles

### Blog System Modifications

- **Blog schemas**: Edit `studio/schemas/blogPost.ts` for data structure
- **Content rendering**: Modify `BlogContent.tsx` for display customization
- **AI prompts**: Update generation logic in `src/lib/generateBlog.ts`
- **Topic management**: Add/remove topics in `src/constants/topics.ts`

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
- **Environment variables**: Ensure Sanity and Gemini credentials are set
- **Studio deployment**: Deploy Sanity Studio separately
- **Sitemap verification**: Check generated files in `public/` after build

## Environment Variables Management

### Required Variables

- `NEXT_PUBLIC_SANITY_PROJECT_ID`: Sanity project identifier
- `NEXT_PUBLIC_SANITY_DATASET`: Usually 'production'
- `SANITY_API_TOKEN`: Write token for content operations

### Optional Variables

- `GEMINI_API_KEY`: For AI blog generation
- `SITE_URL`: Custom domain (auto-detected otherwise)

### Development vs Production

- **Development**: Uses local studio and dev Sanity dataset
- **Production**: Uses production Sanity dataset with ISR caching
- **Studio**: Separate deployment with environment variable inheritance
