# Tech Stack

## Core Framework & Language

- **Next.js 15** (App Router) - React framework with server-side rendering and API routes
- **React 19.2.0** - UI library with latest features
- **TypeScript 5.9.3** - Strict mode enabled for type safety
- **Node.js 22.x** - Runtime environment

## Styling & UI

- **TailwindCSS v4.1.14** - Utility-first CSS framework with modern @theme directive
- **PostCSS** - CSS processing and autoprefixer
- **React Icons** - Icon library
- **React Hot Toast** - Notification system

## Content Management & AI

- **Sanity CMS** (@sanity/client 7.12.0, next-sanity 11.4.2) - Headless CMS
- **Google Gemini AI** (@google/generative-ai 0.24.1) - AI content generation
- **Portable Text** (@portabletext/react, @portabletext/types) - Rich text rendering

## Markdown Processing

- **unified 11.0.5** - Markdown processing pipeline
- **remark-gfm, remark-breaks, remark-parse** - Markdown parsing
- **rehype-pretty-code, rehype-external-links, rehype-slug, rehype-stringify** - HTML processing
- **@rehype-pretty/transformers** - Code syntax highlighting transformers

## Validation & Utilities

- **Zod 4.1.12** - Schema validation
- **DOMPurify & jsdom** - HTML sanitization

## Infrastructure & Performance

- **Upstash Redis** (@upstash/ratelimit 2.0.6, @upstash/redis 1.35.5) - Rate limiting
- **Vercel Analytics & Speed Insights** - Performance monitoring
- **Next Sitemap** - SEO sitemap generation

## Development & Quality

- **Biome.js v2.2.5** - Combined linting and formatting tool (single quotes, 2 spaces, 100 line width)
- **Husky & lint-staged** - Git hooks for quality gates
- **pnpm 10.18.2** - Package manager

## Deployment

- **Vercel** - Hosting and deployment platform
- **ISR (Incremental Static Regeneration)** - 60-second revalidation for dynamic content
