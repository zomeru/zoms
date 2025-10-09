# Zoms Portfolio & AI Blog

Modern personal portfolio + AI-assisted technical blog. Built with **Next.js 15 App Router**, **React 19**, **TypeScript (strict)**, **TailwindCSS v4**, **Sanity CMS**, and **Google Gemini** for automated post generation. Includes structured logging, centralized error handling, and adaptive rate limiting (Upstash Redis + in-memory fallback).

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Scripts](#scripts)
7. [Content Model & Flow](#content-model--flow)
8. [API Endpoints](#api-endpoints)
9. [AI Blog Generation Contract](#ai-blog-generation-contract)
10. [Quality & Tooling](#quality--tooling)
11. [Development Guidelines](#development-guidelines)
12. [Performance & Observability](#performance--observability)
13. [Security](#security)
14. [Project Structure](#project-structure)
15. [Contributing](#contributing)
16. [License](#license)

---

## Features

### Portfolio

- Responsive layout (mobile-first, grid-based sections)
- Themed with Tailwind token system (`@theme` in `globals.css`)
- Sections: About, Projects, Tech Stack, Experience, Blog preview

### Blog System

- AI-powered generation via Gemini (`/api/blog/generate`)
- Sanity-backed storage (raw markdown stored in `body`)
- Pagination + summary + tags + read time
- ISR (60s) for list + detail fetches

### Markdown Pipeline

Two modes currently supported:

1. **Pre-rendered HTML** (current production usage) – `BlogContent.tsx` renders trusted HTML.
2. **Unified processor** (legacy/optional) – `unified.ts` using `remark/rehype` + `rehype-pretty-code` (still present but not the default path).

### Platform Features

- Adaptive rate limiting (Upstash sliding window; fallback to in-memory)
- Structured & sanitized logging (no raw secrets / emails obfuscated)
- Centralized error handling & Zod validation
- Topic selection randomness with weighted combination logic

### Developer Experience

- Import sorting + Prettier formatting + linting gates
- Strict TypeScript (no unintentional `any`)
- Modular utilities in `src/lib/`

---

## Tech Stack

| Layer                         | Tools                                                                       |
| ----------------------------- | --------------------------------------------------------------------------- |
| Framework                     | Next.js 15 (App Router)                                                     |
| Language                      | TypeScript 5.9 (strict)                                                     |
| UI                            | React 19, TailwindCSS v4                                                    |
| CMS                           | Sanity (`@sanity/client`, `next-sanity`)                                    |
| AI                            | Google Gemini (`@google/generative-ai`)                                     |
| Validation                    | Zod                                                                         |
| Rate Limiting                 | Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) + in-memory fallback |
| Markdown (optional processor) | unified, remark-gfm, rehype-pretty-code, rehype-external-links, rehype-slug |
| Logging                       | Custom logger (structured JSON / pretty dev)                                |
| Tooling                       | ESLint (love config + prettier), Prettier, Husky, lint-staged               |
| Deployment                    | Vercel + ISR                                                                |

---

## Architecture Overview

Core concerns separated by responsibility:

- **`src/app`**: Routing, layouts, API handlers
- **`src/lib`**: Pure utilities (AI generation, rate limiting, logging, error handling, sanity client, schemas)
- **`src/constants`**: Static lists (projects, topics, experience metadata)
- **`studio/`**: Sanity Studio workspace & schema definitions
- **`src/components`**: Presentation + interactive client components
- **Caching / ISR**: All Sanity fetches set `revalidate: 60`

---

## Getting Started

### Prerequisites

- Node.js 22.x
- pnpm 10.x
- Sanity account & project (for dynamic content)

### Install

```bash
git clone https://github.com/zomeru/zoms.git
cd zoms
pnpm install
```

### Environment Setup

Copy and fill env file:

```bash
cp .env.example .env.local
```

Then run:

```bash
pnpm dev        # Next.js app (http://localhost:3000)
pnpm studio:dev # Sanity Studio (http://localhost:3333)
```

---

## Environment Variables

| Variable                        | Required          | Description                                                     |
| ------------------------------- | ----------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes               | Sanity project ID                                               |
| `NEXT_PUBLIC_SANITY_DATASET`    | Yes               | Sanity dataset (e.g. production)                                |
| `SANITY_API_TOKEN`              | Yes (write ops)   | Token for create/update from server routes                      |
| `GEMINI_API_KEY`                | For AI generation | Google Gemini key for `/api/blog/generate`                      |
| `UPSTASH_REDIS_REST_URL`        | Optional          | Enables distributed rate limiting                               |
| `UPSTASH_REDIS_REST_TOKEN`      | Optional          | Token for Upstash Redis                                         |
| `NEXLOG_LEVEL`                  | Optional          | Default log level (debug/info etc.)                             |
| `NEXLOG_STRUCTURED`             | Optional          | `true` for JSON logs (defaults structured in prod)              |
| `SITE_URL`                      | Optional          | Explicit canonical URL                                          |
| `CRON_SECRET`                   | Optional          | Required by generate endpoint in non-dev (Authorization Bearer) |

---

## Scripts

```bash
pnpm dev               # Start dev server
pnpm build             # Run quality gates then build
pnpm start             # Start production build
pnpm lint              # ESLint with auto-fix
pnpm format            # Prettier write
pnpm check-types       # TypeScript type check
pnpm check-format      # Prettier check only
pnpm check-lint        # ESLint check only
pnpm test-all          # format + lint + types
pnpm test-all:build    # test-all + build
pnpm studio:dev        # Run Sanity Studio locally
pnpm studio:build      # Build Studio
pnpm studio:deploy     # Deploy Studio
```

Pre-commit (Husky + lint-staged) auto-runs ESLint + Prettier on staged files.

---

## Content Model & Flow

1. **Generation** (AI) → `generateBlogContent()` builds prompt, enforces JSON contract.
2. **Validation & Storage** → `/api/blog/generate` validates env + rate limit + stores raw markdown to Sanity.
3. **Retrieval** → `getBlogPosts` & `getBlogPostBySlug` via GROQ with 60s revalidation.
4. **Rendering** → Current implementation uses pre-rendered HTML or optional unified pipeline if re-enabled.

Topics are pseudo-randomly combined from curated lists (`src/constants/topics.ts`).

---

## API Endpoints

| Method   | Path                 | Description                                                                 | Rate Limit Config       |
| -------- | -------------------- | --------------------------------------------------------------------------- | ----------------------- |
| GET      | `/api/blog`          | Paginated list (`limit`, `offset`)                                          | `BLOG_API` (100/min)    |
| GET      | `/api/blog/[slug]`   | Single post by slug                                                         | `BLOG_API`              |
| GET/POST | `/api/blog/generate` | AI generate + persist blog (POST optional body `{ aiGenerated?: boolean }`) | `BLOG_GENERATE` (5/min) |

Error responses follow shape:

```json
{
  "error": "Message",
  "code": "ERROR_CODE",
  "timestamp": "ISO",
  "details": {
    /* dev only */
  }
}
```

Rate limit exceed response:

```json
{
  "error": "Too many requests...",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## AI Blog Generation Contract

Function: `generateBlogContent()` must return:

```ts
interface GeneratedBlogPost {
  title: string; // truncated to MAX_TITLE_LENGTH
  summary: string; // truncated to MAX_SUMMARY_LENGTH
  body: string; // raw markdown
  tags: string[]; // 3–5 tags
  readTime: number; // words / 200 (ceil) fallback 5
}
```

If prompt/schema changes: update `generateBlog.ts`, helper parser (`generateBlogHelpers.ts`), this README, and `.github/copilot-instructions.md`.

---

## Quality & Tooling

- ESLint config based on `eslint-config-love` + custom relaxations
- Prettier + import sort plugin
- `test-all` gate blocks build (format, lint, types)
- Husky ensures local consistency pre-commit

---

## Development Guidelines

| Area          | Guideline                                                 |
| ------------- | --------------------------------------------------------- |
| Components    | Server-first; add `'use client'` only when interactive    |
| Logging       | Use `log` util; never `console.*` directly                |
| Validation    | Zod schemas + `validateSchema` / `safeValidate`           |
| Errors        | Throw `ApiError`; wrap route logic in `withErrorHandling` |
| Rate Limiting | Use `rateLimitMiddleware` for write/compute endpoints     |
| Imports       | Let Prettier sort; no manual micro-grouping               |
| Styling       | Tailwind utilities; tokens in `globals.css` @theme        |
| Secrets       | Never log raw env values / PII                            |

---

## Performance & Observability

- ISR (60s) balanced freshness vs cost
- Structured logs in production; pretty logs in dev
- PII sanitization (emails partially masked; secret key terms replaced)
- Async timing helper: `log.timeAsync(label, fn)` wraps performance spans

---

## Security

- Rate limiting layers (Redis or fallback)
- Schema validation on all API inputs
- Sanitized error responses (full stack only in dev)
- Logger scrubs sensitive keys (password, token, secret, authorization)

If exposing new user-generated markdown: add sanitization before `dangerouslySetInnerHTML` usage.

---

## Project Structure

```
src/
  app/
    api/blog/                # Blog API endpoints
    blog/                    # Blog pages (list + slug)
    layout.tsx               # Root layout
    page.tsx                 # Home page sections
  components/                # Reusable UI + sections + portals
  constants/                 # Static datasets (projects, topics, experience)
  lib/                       # Core utilities (AI, logging, rate limit, sanity, schemas)
  configs/                   # SEO & shared config
  styles/globals.css         # Tailwind v4 tokens & utilities
studio/                      # Sanity Studio (schemas + config)
public/                      # Static assets & sitemaps
.github/                     # Copilot instructions & workflows (future)
```

---

## License

MIT

---

**Made with ☕ – Building the future one line at a time.**
