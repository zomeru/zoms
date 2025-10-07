# Project Overview

## Purpose

This is Zomer Gregorio's personal portfolio website - a modern, responsive Next.js application showcasing his work as a Software Engineer. The site features a dark theme with purple accents and presents information about experience, tech stack, projects, contact details, and a dynamic blog system.

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript with strict configuration
- **Styling**: TailwindCSS v4.1.13 with custom color scheme (dark theme)
- **Content Management**: Sanity CMS for experience and blog content
- **AI Integration**: Google Gemini AI for automatic blog generation
- **Package Manager**: pnpm 10.17.1
- **Font**: Inter (Google Fonts)
- **Icons**: React Icons
- **Modals**: React Modal
- **Code Highlighting**: React Syntax Highlighter
- **Analytics**: Vercel Analytics and Speed Insights

## Key Features

- Two-column responsive portfolio layout with scroll-based sections
- Dynamic blog system with AI-powered content generation
- Content management via Sanity Studio
- Mouse follower component for interactive experience
- Dark theme with custom purple/pink gradient colors
- SEO optimized with comprehensive metadata
- Sitemap generation and social media redirects
- ISR (Incremental Static Regeneration) with 60s revalidation
- Weekly automated blog posting via Vercel Cron

## Architecture

- **Frontend**: Next.js App Router structure in `src/app/`
- **CMS**: Sanity Studio in separate `studio/` workspace
- **Content**: Dynamic experience and blog data from Sanity, static projects/tech stack from constants
- **AI Generation**: Automated blog creation using Gemini AI with topic rotation

## Deployment

- **Production**: https://zoms.vercel.app
- **Development**: https://dev-zoms.vercel.app
- **Studio**: Deployed via Sanity hosting
- **Hosting**: Vercel with ISR and Cron jobs

## Content Management Strategy

- **Static Content**: Tech stack, projects, personal info stored in `constants/`
- **Dynamic Content**: Experience and blog posts managed via Sanity CMS
- **AI Content**: Weekly blog generation with curated topics and tech focus
- **Hybrid Approach**: Manual and AI-generated blog posts supported
