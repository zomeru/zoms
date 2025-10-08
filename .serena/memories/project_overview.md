# Project Overview

## Purpose

This is Zomer Gregorio's personal portfolio website - a modern, responsive Next.js application showcasing his work as a Software Engineer. The site features a dark theme with purple accents, dynamic content management, AI-powered blog generation, and enterprise-grade features like rate limiting, structured logging, and comprehensive error handling.

## Tech Stack

### Frontend & Framework

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.9.3 with strict configuration
- **UI Components**: React 19.2.0
- **Styling**: TailwindCSS v4.1.14 with modern `@theme` directive
- **Package Manager**: pnpm 10.17.1

### Content Management & AI

- **CMS**: Sanity for dynamic content management (@sanity/client 7.12.0)
- **AI Integration**: Google Gemini API (@google/generative-ai 0.24.1) for blog generation
- **Rich Text**: Portable Text with React Syntax Highlighter
- **Image Handling**: Sanity Image URLs with Next.js optimization

### Data Validation & API

- **Schema Validation**: Zod 4.1.12 for type-safe API validation
- **Rate Limiting**: Upstash Redis with in-memory fallback
- **Error Handling**: Centralized error management with environment-aware responses
- **Logging**: Custom Edge Runtime-compatible logger with GDPR compliance

### Development & Quality

- **Linting**: ESLint 9.36.0 with TypeScript and Promise rules
- **Formatting**: Prettier with import sorting plugin
- **Git Hooks**: Husky with lint-staged for pre-commit validation
- **Analytics**: Vercel Analytics and Speed Insights

### Infrastructure

- **Font**: Inter (Google Fonts) with font-display: swap
- **Icons**: React Icons 5.0.1
- **Modals**: React Modal with custom Portal system
- **Notifications**: React Hot Toast with custom styling

## Key Features

### Core Portfolio Features

- **Two-column responsive layout** with fixed sidebar and scrollable content
- **Dark theme** with purple (#ad5aff) and pink (#ffb2de) accent colors
- **Mouse follower component** for interactive experience
- **SEO optimization** with comprehensive metadata and automatic sitemaps
- **Social media redirects** configured in Next.js

### Advanced Blog System

- **AI-powered content generation** using Google Gemini with topic rotation
- **Dynamic routing** with `/blog` listing and `/blog/[slug]` individual posts
- **Manual and automated posting** via Sanity Studio or AI generation
- **Syntax highlighting** for code blocks in blog posts
- **ISR (Incremental Static Regeneration)** with 60-second revalidation

### Enterprise Features

- **Rate limiting** with Redis backend and in-memory fallback
- **Structured logging** with automatic PII sanitization
- **Comprehensive error handling** with environment-aware messages
- **Type-safe API validation** using Zod schemas
- **GDPR-compliant logging** with sensitive data redaction

### Performance & Security

- **Edge Runtime compatibility** for optimal performance
- **Environment-based configurations** for development vs production
- **Comprehensive TypeScript coverage** with strict type checking
- **Dependency security** monitoring via Dependabot

## Architecture

### Frontend Architecture

- **App Router structure** in `src/app/` with layout and page components
- **Component-based design** with barrel exports for clean imports
- **Portal system** for modals and overlays
- **Custom utility classes** in TailwindCSS v4

### Backend Architecture

- **API routes** for blog CRUD operations (`/api/blog/`)
- **Middleware-style utilities** for rate limiting and error handling
- **Schema-driven validation** with comprehensive type safety
- **Fallback strategies** for external service failures

### Content Architecture

- **Hybrid content strategy**: Static constants for stable data, Sanity CMS for dynamic content
- **AI content pipeline**: Topic rotation → Gemini generation → Sanity publication
- **Flexible schemas**: Support for both manual and AI-generated content

## Deployment & Environment

### Production Deployment

- **Primary Domain**: https://zoms.vercel.app
- **Development**: https://dev-zoms.vercel.app
- **Sanity Studio**: Separate deployment via Sanity hosting
- **ISR Caching**: 60-second revalidation for dynamic content

### Environment Configuration

- **Required**: Sanity project ID, dataset, and API token
- **Optional**: Gemini API key, Upstash Redis credentials
- **Logging**: Configurable log levels and structured output
- **Rate Limiting**: Upstash Redis with graceful fallback

## Content Management Strategy

### Static Content Management

- **Projects**: Maintained in `src/constants/projects.ts`
- **Tech Stack**: Configured in `src/constants/other.ts`
- **Personal Info**: Static constants with type safety
- **Blog Topics**: AI generation topics in `src/constants/topics.ts`

### Dynamic Content Management

- **Experience Data**: Managed via Sanity CMS with fallback constants
- **Blog Posts**: Support for manual creation and AI generation
- **Real-time Updates**: ISR ensures fresh content without rebuilds
- **Content Schemas**: Type-safe Sanity schemas with TypeScript interfaces

### AI Content Generation

- **Topic Rotation**: Curated technical topics for consistent content
- **Quality Assurance**: Structured prompts for high-quality technical content
- **Automated Publishing**: Direct integration with Sanity CMS
- **Manual Override**: Full editorial control via Sanity Studio

## Development Workflow

### Local Development

- **Hot Reloading**: Next.js development server with fast refresh
- **Studio Integration**: Local Sanity Studio for content management
- **Type Safety**: Real-time TypeScript checking and validation
- **Quality Gates**: Pre-commit hooks ensure code quality

### Content Workflows

- **Static Updates**: Git-based workflow for constant modifications
- **Dynamic Updates**: Sanity Studio with immediate ISR updates
- **AI Generation**: One-click blog creation with quality controls
- **Content Review**: Editorial workflow via Sanity Studio

### Deployment Pipeline

- **Automated Deployment**: Git push triggers Vercel deployment
- **Quality Validation**: Pre-build testing and type checking
- **Content Deployment**: Separate Sanity Studio deployment
- **Performance Monitoring**: Vercel Analytics integration
