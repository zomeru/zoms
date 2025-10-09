# GitHub Copilot Instructions - Zoms Portfolio & AI Blog

Authoritative guide for AI assistants contributing to this repository. Keep this file concise, high-signal, and updated when architecture or tooling changes.

## 1. Project Summary

Modern personal portfolio + AI-generated technical blog.
Stack: Next.js 15 (App Router, TS strict), React 19, TailwindCSS v4, Sanity CMS, Google Gemini AI, Upstash Redis (rate limiting), Zod validation, structured logging.

## 2. Core Architecture

- App Router (`src/app`) with server components by default; mark interactive files with `'use client'`.
- Blog content: Gemini produces JSON containing markdown body → stored in Sanity (`body`) → rendered to HTML (current implementation uses pre-rendered HTML in `BlogContent.tsx`; ensure sanitation if enabling raw markdown rendering).
- Revalidation: Queries include `next: { revalidate: 60 }` for incremental freshness.
- Rate limiting: `rateLimit.ts` (in‑memory + Upstash sliding window). Stricter on generation endpoint.
- Error layer: `errorHandler.ts` (`ApiError`, `withErrorHandling`, `handleApiError`). Always use in API routes.
- Logging: `logger.ts` (`log.debug|info|warn|error|fatal`). Structured JSON in production, emoji pretty in dev. Never use `console.*` directly.

## 3. Key Files & Responsibilities

- `src/lib/generateBlog.ts` – Gemini prompt & parsing (JSON contract). Do not change schema without updating README + consumers.
- `src/lib/generateBlogHelpers.ts` – Resilient JSON extraction helpers. Keep deterministic & side‑effect free.
- `src/lib/blog.ts` – Sanity GROQ data fetch utilities (pagination + ISR semantics).
- `src/lib/rateLimit.ts` – Upstash/in‑memory hybrid. Use `rateLimitMiddleware` early in write-heavy routes.
- `src/lib/errorHandler.ts` – Centralized error + validation wrappers.
- `src/lib/logger.ts` – Sanitizing logger.
- `src/lib/sanity.ts` – Sanity client (version pinned by date; update when adopting new schema features).
- `src/constants/*.ts` – Non‑dynamic reference data (projects, topics, experience, limits). Reuse instead of duplicating strings.

## 4. Coding Conventions

- TypeScript strict: avoid `any`; prefer explicit interfaces or `z.infer<typeof schema>`.
- Prefer pure functions in `lib/`. Keep side effects (fetch, env reads) near boundaries.
- Imports auto‑sorted via Prettier + import sort plugin. Don’t handcraft grouping unless semantically meaningful.
- React: server components default; only mark as client if using hooks, event handlers, browser APIs.
- Return early; favor small utilities over large monolith functions.
- Error paths: throw `ApiError` or let Zod throw; transform inside `withErrorHandling`.

## 5. API Route Pattern (Minimal Template)

```ts
import { NextResponse, type NextRequest } from 'next/server';

import { ApiError, validateSchema, withErrorHandling } from '@/lib/errorHandler';
import { log } from '@/lib/logger';
import { RATE_LIMIT_CONFIGS, rateLimitMiddleware } from '@/lib/rateLimit';
import { someSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  const limited = await rateLimitMiddleware(request, 'DEFAULT');
  if (limited) return limited;

  return withErrorHandling(
    async () => {
      const json = await request.json();
      const data = validateSchema(someSchema, json);
      // business logic
      log.info('Did thing', { feature: 'X' });
      return NextResponse.json({ ok: true, data });
    },
    { method: 'POST', path: '/api/feature' }
  );
}
```

## 6. AI Blog Generation Contract

Function: `generateBlogContent()` returns `{ title, summary, body, tags, readTime }`.

- Title: truncated to `MAX_TITLE_LENGTH`.
- Summary: truncated to `MAX_SUMMARY_LENGTH`.
- Body: raw markdown (escaped JSON string). Do not mutate before storage.
- If adjusting prompt or JSON schema, update: helper parser, README (AI section), and this file.

## 7. Rate Limiting Guidelines

- Generation endpoint: use `configKey = 'BLOG_GENERATE'` (5 req/min/IP default).
- High-read endpoints can typically skip explicit middleware; rely on caching unless abuse risk emerges.
- New mutation or compute-heavy endpoints must implement rate limit + logging.

## 8. Logging Practices

```ts
log.info('Blog generated', { id, readTime, tags });
log.warn('Rate limit exceeded', { identifier, path });
log.error('AI generation failed', { cause: err.message });
```

Never log full request bodies containing secrets/PII. Logger auto‑sanitizes keys (`password`, `token`, `secret`, etc.).

## 9. Validation & Schemas

- Extend/update `schemas.ts` for new input shapes.
- Use `validateSchema` for mandatory validity; `safeValidate` when optional.
- Return 400 earlier than performing expensive operations.

## 10. Styling & UI Rules

- TailwindCSS v4 utilities; theme tokens in `globals.css` under `@theme`.
- Prefer semantic grouping via small wrapper components for repeated class sets.
- Avoid custom CSS unless necessary; if used, colocate or add utility via `@utility` in `globals.css`.

## 11. Performance & Optimization

- Avoid adding heavy markdown/rehype plugins (legacy pipeline intentionally removed).
- Use incremental static regeneration (revalidate: 60) for Sanity data access.
- Batch network calls or use GROQ projections to avoid N+1 queries.
- Keep Gemini prompt deterministic; minimize token overhead.

## 12. Environment Variables (Quick Ref)

Required for full feature set:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`
- `GEMINI_API_KEY` (AI generation)
  Optional / Infra:
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (prod rate limiting)
- `NEXLOG_LEVEL`, `NEXLOG_STRUCTURED` (logging)
- `SITE_URL`

## 13. Adding Dependencies

Checklist:

1. Justify necessity (avoid bloat).
2. Ensure ESM compatibility with Next 15.
3. Confirm tree-shakeability or minimal footprint.
4. Update README (Tech Stack) if user-facing.
5. Run `pnpm test-all` before commit.

## 14. Commit & PR Standards

- Conventional commits encouraged (e.g., `feat: add X`, `fix: resolve Y`).
- Keep PRs < 300 LOC when possible; refactors separated from feature changes.
- Document architectural shifts in README + this file.

## 15. Anti-Patterns to Avoid

- Reintroducing `rehype-pretty-code` or heavy synchronous markdown transforms.
- Direct `console.log` usage.
- Hardcoding repeated literals (reuse constants).
- Swallowing errors silently (always log).
- Broad `catch` without contextual metadata.

## 16. When to Update This File

- Changes to AI prompt / output schema
- Modifications to rate limit policy
- Logging format alterations
- Framework major upgrades (Next, React, Tailwind, TypeScript)
- Addition/removal of substantial infrastructure (e.g., new datastore)

## 17. Fast Review Checklist (Assistant Self-Check)

- [ ] Types complete / no `any`
- [ ] No new lint errors (`pnpm check-lint`)
- [ ] Format applied (`pnpm format` or pre-commit)
- [ ] Proper error + logging usage
- [ ] Rate limiting where required
- [ ] Docs updated (README / this file)

---

Keep edits lean, typed, and observable through logging. Ship maintainable, auditable code.
