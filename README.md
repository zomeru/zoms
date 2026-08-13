# Zoms

Personal portfolio and technical blog, built with Next.js. It includes a Sanity-backed blog, optional AI-assisted post generation, and a grounded site assistant.

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS
- Sanity CMS and Studio
- Prisma + Supabase Postgres
- Vercel AI SDK, OpenRouter, Google Gemini
- Upstash Vector and Redis

## Getting started

Requirements: Node.js 24 and pnpm 11.

```bash
git clone https://github.com/zomeru/zoms.git
cd zoms
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs at `http://zoms.localhost:1355`. Start Sanity Studio separately with `pnpm studio:dev`.

## Configuration

Use [.env.example](.env.example) as the source of truth for configuration. In brief:

- **Sanity:** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `SANITY_API_TOKEN` for writes.
- **Database:** `DATABASE_URL` and `DIRECT_URL`.
- **AI assistant:** `OPENROUTER_API_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`, and `AI_REINDEX_SECRET`.
- **Blog generation:** `GEMINI_API_KEY` or OpenRouter configuration, plus `BLOG_GENERATION_SECRET`.
- **Optional services:** Upstash Redis, GitHub, WakaTime, and Supermemory credentials.

Never commit `.env.local`.

## Commands

```bash
pnpm dev                 # Run the app locally
pnpm build               # Production build
pnpm check               # Format, lint, and type checks
pnpm test:unit           # Vitest suite
pnpm test:all:build      # Full checks plus build
pnpm studio:dev          # Run Sanity Studio
pnpm db:migrate          # Create/apply a development migration
pnpm db:generate         # Generate Prisma client
pnpm ai:reindex          # Rebuild the assistant's content index
```

## Project layout

```text
src/app/          Routes and API handlers
src/components/   UI and assistant components
src/lib/          AI, retrieval, ingestion, database, and shared utilities
src/constants/    Portfolio and topic data
prisma/           Prisma schema and migrations
studio/           Sanity Studio (separate package)
tests/vitest/     Unit and integration tests
scripts/          Project automation
```

## Notes

- Sanity content fetches use 60-second revalidation.
- The assistant retrieves indexed site content before answering and returns citations when supported.
- Run `pnpm test:all:build` before merging application changes.
