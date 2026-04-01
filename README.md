# Zoms Portfolio & AI Blog

Modern personal portfolio + AI-assisted technical blog. Built with **Next.js 16 App Router**, **React 19**, **TypeScript 5.9 (strict)**, **TailwindCSS v4**, **Sanity CMS**, and **Google Gemini** for automated post generation. Includes a site-wide grounded AI assistant backed by **OpenRouter**, **Upstash Vector**, **Upstash Redis**, **Supermemory**, and **Prisma + Neon PostgreSQL**, plus structured logging, centralized error handling, adaptive rate limiting, and bot protection via **botid**.

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
9. [AI Assistant](#ai-assistant)
10. [AI Blog Generation Contract](#ai-blog-generation-contract)
11. [Quality & Tooling](#quality--tooling)
12. [Development Guidelines](#development-guidelines)
13. [Performance & Observability](#performance--observability)
14. [Security](#security)
15. [Project Structure](#project-structure)
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
- Site-wide AI assistant with grounded answers, citations, related content, and blog transforms

### Developer Experience

- Import sorting + Prettier formatting + linting gates
- Strict TypeScript (no unintentional `any`)
- Modular utilities in `src/lib/`

---

## Tech Stack

| Layer                         | Tools                                                                       |
| ----------------------------- | --------------------------------------------------------------------------- |
| Framework                     | Next.js 16 (App Router)                                                     |
| Language                      | TypeScript 5.9 (strict)                                                     |
| UI                            | React 19, TailwindCSS v4                                                    |
| CMS                           | Sanity (`@sanity/client`, `next-sanity`)                                    |
| AI                            | Google Gemini (`@google/genai`), OpenRouter + Vercel AI SDK, Supermemory    |
| Validation                    | Zod                                                                         |
| Rate Limiting                 | Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) + in-memory fallback |
| Vector Search                 | Upstash Vector                                                              |
| Database                      | Prisma ORM + Neon PostgreSQL                                                |
| Markdown (optional processor) | unified, remark-gfm, rehype-pretty-code, rehype-external-links, rehype-slug |
| Logging                       | Custom logger (structured JSON / pretty dev)                                |
| Tooling                       | ESLint (love config + prettier), Prettier, Husky, lint-staged               |
| Bot Protection                | botid                                                                       |
| Deployment                    | Vercel + ISR                                                                |

---

## Architecture Overview

Core concerns separated by responsibility:

- **`src/app`**: Routing, layouts, API handlers
- **`src/lib`**: Pure utilities (AI generation, rate limiting, logging, error handling, sanity client, schemas)
- **`src/lib/ai`, `src/lib/retrieval`, `src/lib/ingestion`**: Assistant prompting, grounded retrieval, indexing, vector orchestration
- **`src/lib/db`, `src/lib/vector`**: Prisma repositories, Upstash Vector access
- **`src/constants`**: Static lists (projects, topics, experience metadata)
- **`studio/`**: Sanity Studio workspace & schema definitions
- **`src/components`**: Presentation + interactive client components
- **`src/components/ai`**: Root-mounted assistant shell, panel, citations, and chat UI
- **Caching / ISR**: All Sanity fetches set `revalidate: 60`

---

## Getting Started

### Prerequisites

- Node.js 24.x
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
| `DATABASE_URL`                  | For AI assistant  | Prisma connection string for Neon/Postgres                      |
| `DIRECT_URL`                    | For migrations    | Direct Postgres URL used by Prisma migrate                      |
| `OPENROUTER_API_KEY`            | For AI assistant  | OpenRouter API key for grounded answers and transforms          |
| `OPENROUTER_CHAT_MODEL`         | For AI assistant  | Chat model used for grounded answers and transforms             |
| `UPSTASH_REDIS_REST_URL`        | Optional          | Enables distributed rate limiting                               |
| `UPSTASH_REDIS_REST_TOKEN`      | Optional          | Token for Upstash Redis                                         |
| `UPSTASH_VECTOR_REST_URL`       | For AI assistant  | Upstash Vector REST endpoint for the hosted-embedding index     |
| `UPSTASH_VECTOR_REST_TOKEN`     | For AI assistant  | Token for Upstash Vector                                        |
| `AI_REINDEX_SECRET`             | For AI assistant  | Protects `/api/ai/reindex` and admin-triggered indexing         |
| `NEXLOG_LEVEL`                  | Optional          | Default log level (debug/info etc.)                             |
| `NEXLOG_STRUCTURED`             | Optional          | `true` for JSON logs (defaults structured in prod)              |
| `SITE_URL`                      | Optional          | Explicit canonical URL                                          |
| `CRON_SECRET`                   | Optional          | Required by generate endpoint in non-dev (Authorization Bearer) |
| `BLOG_GENERATION_SECRET`        | For AI generation | Authenticates POST `/api/blog/generate` requests                |
| `GEMINI_MODEL`                  | For AI generation | Gemini model ID (e.g. `gemini-2.5-pro`)                         |
| `OPENROUTER_EMBEDDING_MODEL`    | For AI assistant  | Model ID for embedding content into vector index                |
| `GITHUB_TOKEN`                  | For dev stats     | Personal access token with `read:user` and `repo` scopes       |
| `GITHUB_USERNAME`               | For dev stats     | GitHub username for GraphQL contribution queries                |
| `WAKATIME_API_KEY`              | For dev stats     | WakaTime API key for coding time breakdown                      |
| `SUPERMEMORY_API_KEY`           | For AI assistant  | Supermemory API key for AI memory features                      |
| `ENABLE_EXPERIMENTAL_COREPACK`  | For deployment    | Enables pnpm via Node.js Corepack on Vercel                    |

---

## Scripts

```bash
pnpm dev               # Start dev server (webpack)
pnpm dev:turbo         # Start dev server (Turbopack)
pnpm build             # Build the Next.js app
pnpm start             # Start production build
pnpm lint              # ESLint with auto-fix
pnpm format            # Prettier write
pnpm check:types       # TypeScript type check
pnpm check:format      # Prettier check only
pnpm check:lint        # ESLint check only
pnpm test:unit         # Run Vitest suite (~37 test files)
pnpm test:all          # format + lint + types + unit tests
pnpm test:all:build    # test:all + build
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:migrate    # Create/update SQL migration artifacts
pnpm prisma:deploy     # Apply pending migrations (production)
pnpm ai:reindex        # Index blog/about/project content into Upstash Vector
pnpm ai:reset          # Reset AI/vector state
pnpm sanity:seed:projects # Seed Sanity with project data
pnpm security:audit    # Audit production dependencies
pnpm security:check    # Run audit-ci against .audit-ci.json
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

| Method   | Path                      | Description                                                                 | Rate Limit Config       |
| -------- | ------------------------- | --------------------------------------------------------------------------- | ----------------------- |
| GET      | `/api/blog`               | Paginated list (`limit`, `offset`)                                          | `BLOG_API` (100/min)    |
| GET/DEL  | `/api/blog/[slug]`        | Single post by slug / delete post                                           | `BLOG_API`              |
| GET/POST | `/api/blog/generate`      | AI generate + persist blog (POST optional body `{ aiGenerated?: boolean }`) | `BLOG_GENERATE` (5/min) |
| POST     | `/api/blog/generate/auth` | Auth check for blog generation                                              | —                       |
| POST     | `/api/ai/chat`            | Streams grounded assistant answers with citations                           | `AI_CHAT`               |
| POST     | `/api/ai/transform`       | Generates grounded `tldr`, `beginner`, or `advanced` transforms             | `AI_TRANSFORM`          |
| POST     | `/api/ai/reindex`         | Protected reindex endpoint for full or targeted assistant indexing          | `AI_REINDEX`            |
| POST     | `/api/ai/reindex/auth`    | Auth check for reindex                                                      | —                       |
| POST     | `/api/admin/access`       | Admin access verification                                                   | —                       |

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

## AI Assistant

The assistant is mounted once in the root layout and stays alive across navigation, so the chat panel keeps its session and message state while the user moves between `/` and blog routes. Blog pages also render a lightweight related-content block from the same retrieval pipeline.

### Architecture

1. Content is normalized from Sanity blog posts plus local about/project sources into a shared document shape.
2. Documents are split into section-aware chunks, hashed, and written to Upstash Vector using the index's hosted embedding model.
3. Prisma stores sessions, messages, ingestion runs, retrieval events, and indexed-document metadata in Neon PostgreSQL.
4. Query-time retrieval embeds the user question, fetches vector matches, applies deterministic reranking heuristics, builds citations, and refuses unsupported answers.
5. The assistant calls the Vercel AI SDK only after retrieval and only with retrieved site content in the prompt.

### Why Upstash Vector

- It keeps vector storage separate from application state, which keeps Postgres focused on relational analytics and session data.
- REST access fits the existing serverless route-handler architecture without adding another always-on service.
- The assistant only needs deterministic top-k retrieval and metadata filtering, so a lightweight hosted vector index is sufficient for v1.
- Using Upstash-hosted embeddings avoids dimension mismatches between external embedding providers and the free-tier index limits.

### Why Neon + Prisma

- Prisma gives typed schema management and repository helpers for assistant analytics and chat persistence.
- Neon works cleanly with Next.js route handlers and serverless-style connections.
- The relational layer is used for durable state, not vectors, which keeps query responsibilities clear.

### Retrieval Notes

- Retrieval is deterministic: Upstash-hosted embedding search plus app-side boosting for titles, slugs, tags, section headings, current-page hints, and modest blog recency.
- v1 intentionally skips reranking models to reduce latency, cost, and operational complexity while the content set is still relatively small.
- If evidence is weak, the assistant refuses instead of improvising.

### Indexing And Verification

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm ai:reindex
pnpm test:unit
pnpm test:all:build
```

`pnpm ai:reindex` supports local indexing without the protected route, while `/api/ai/reindex` exists for authenticated server-triggered reindex flows.

For the current setup, create your Upstash Vector index with a hosted embedding model such as `BAAI/bge-large-en-v1.5`, then provide only the index REST URL and token to the app.

### Future Enhancements

- Add richer admin tooling around ingestion health and stale-document cleanup.
- Revisit reranking once the corpus grows enough to justify the extra latency/cost.
- Add richer citation previews and deeper analytics for unsupported questions.

---

## AI Blog Generation Contract

Function: `generateBlogContent()` must return:

```ts
interface GeneratedBlogPost {
  title: string; // truncated to MAX_TITLE_LENGTH
  summary: string; // truncated to MAX_SUMMARY_LENGTH
  body: string; // raw markdown
  tags: string[]; // up to 8 tags
  readTime: number; // words / 200 (ceil)
}
```

AI model output schema expected by parser (`tryParseAIJSON`) is:

```ts
interface AIResponseShape {
  title: string;
  slug: string;
  excerpt: string;
  tags: string[]; // 5–8 tags
  content: string; // markdown body
}
```

If prompt/schema changes: update files in `src/lib/blog-generator/` (generators, helpers, types), this README, and `.github/copilot-instructions.md`.

---

## Quality & Tooling

- ESLint config based on `eslint-config-love` + custom relaxations
- Prettier + import sort plugin
- `test:all` gate: format + lint + types + unit tests
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
    api/blog/                # Blog CRUD + generation endpoints
    api/ai/                  # AI chat, transform, reindex endpoints
    api/admin/               # Admin access control
    blog/                    # Blog pages (list + slug)
    admin/                   # Admin page
    layout.tsx               # Root layout (mounts AI assistant shell)
    page.tsx                 # Home page sections
  components/                # Reusable UI + sections + portals + AI chat
  constants/                 # Static datasets (projects, topics, experience)
  lib/                       # Core utilities organized by concern
    ai/                      # Assistant prompts, streaming, transform, memory, schemas
    blog-generator/          # Gemini + OpenRouter generators, helpers, types
    retrieval/               # RAG search, rank, dedupe, classify, citations
    ingestion/               # Vector indexing: chunk, normalize, hash, CLI
    db/                      # Prisma client + repositories
    vector/                  # Upstash Vector client
    github/                  # GitHub API integration
  configs/                   # SEO & shared config
  styles/globals.css         # Tailwind v4 tokens & utilities
tests/vitest/                # Vitest unit/integration tests (~37 files)
scripts/                     # Automation (prisma, AI reindex/reset, vitest runner, sanity seeder)
prisma/                      # Schema + migrations (Neon PostgreSQL)
studio/                      # Sanity Studio (schemas: blogPost, project, experience, blockContent)
public/                      # Static assets, PWA icons, screenshots
.github/                     # Copilot instructions + CI workflows (tests.yml)
```

---

## License

MIT

---

**Made with ☕ – Building the future one line at a time.**
