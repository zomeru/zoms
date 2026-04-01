# AGENTS.md

## Project Overview

Personal portfolio site with an AI-assisted technical blog and a site-wide grounded AI assistant. Built with Next.js 16 App Router, React 19, TypeScript 5.9 (strict), Tailwind CSS v4, Sanity CMS, Google Gemini (blog generation), and OpenRouter + Vercel AI SDK (chat assistant). Data layer: Prisma ORM + Neon PostgreSQL for session/analytics, Upstash Vector for RAG retrieval, Upstash Redis for rate limiting. Bot protection via botid. Deployed on Vercel.

The root workspace contains two areas:

- The main web app in `src/`
- The Sanity Studio workspace in `studio/` (separate `package.json`, not a pnpm workspace)

If nested `AGENTS.md` files are added later, the closest file should take precedence. Until then, this root file applies to both the main app and `studio/`.

## Environment And Tooling

- Use `pnpm` for all package management and scripts.
- Use Node.js 24.x. `package.json`, Volta, and CI all target Node 24.
- Install dependencies from the repository root with `pnpm install`.
- Do not commit secrets or `.env.local`.

## Repository Layout

- `src/app`: Next.js routes, layouts, metadata, API handlers (blog, AI chat, admin, generation, reindex)
- `src/components`: UI and client components (sections, ui/, ai/, Portal/)
- `src/lib`: core utilities organized by concern:
  - `ai/`: AI assistant (prompts, streaming, transform, memory, schemas, direct-answers)
  - `blog-generator/`: blog generation (Gemini + OpenRouter generators, helpers, types)
  - `retrieval/`: RAG pipeline (search, rank, dedupe, classify, citations)
  - `ingestion/`: vector indexing (chunk, normalize, hash, sections, CLI, reindex)
  - `db/`: Prisma client and repositories
  - `vector/`: Upstash Vector client
  - `github/`, `content/`: GitHub API integration, content type definitions
  - Root files: blog, sanity, logger, errorHandler, rateLimit, schemas, unified, utils, wakatime, experience, ogImage, etc.
- `src/constants`: static data (projects, topics, experience)
- `src/configs`: site config, SEO config
- `src/styles`: `globals.css` (Tailwind v4 `@theme` tokens)
- `tests/vitest`: Vitest unit/integration tests (~37 test files)
- `scripts/`: automation scripts (Prisma generate/migrate, AI reindex/reset, Vitest runner, Sanity seeder)
- `prisma/`: Prisma schema and migrations (PostgreSQL via Neon)
- `public`: static assets, PWA icons, screenshots
- `studio`: Sanity Studio (schemas: blogPost, project, experience, blockContent)
- `.github/workflows`: CI (tests.yml — format, lint, types, unit tests, build, audit)
- `.github/copilot-instructions.md`: GitHub Copilot instructions

## Common Commands

Run these from the repository root:

- `pnpm dev`: start Next.js app (webpack mode)
- `pnpm dev:turbo`: start Next.js app (Turbopack)
- `pnpm build`: build the Next.js app (`next build` only — no quality gates)
- `pnpm start`: start production build
- `pnpm check:format`: verify Prettier formatting
- `pnpm format`: apply Prettier formatting
- `pnpm check:lint`: run ESLint without edits
- `pnpm lint`: run ESLint with `--fix`
- `pnpm check:types`: run the TypeScript checker
- `pnpm test:unit`: run Vitest unit tests
- `pnpm test:all`: run format + lint + types + unit tests
- `pnpm test:all:build`: run `test:all` then `build`
- `pnpm prisma:generate`: generate Prisma client
- `pnpm prisma:migrate`: create/apply SQL migrations
- `pnpm ai:reindex`: index content into Upstash Vector (local CLI)
- `pnpm ai:reset`: reset AI/vector state
- `pnpm sanity:seed:projects`: seed Sanity with project data
- `pnpm studio:dev`: start Sanity Studio
- `pnpm studio:build`: build Sanity Studio
- `pnpm studio:deploy`: deploy Sanity Studio
- `pnpm security:audit`: audit production dependencies
- `pnpm security:check`: run `audit-ci` against `.audit-ci.json`

## Development Workflow

- Prefer small, targeted changes that match the existing architecture.
- Read nearby code before editing. The repo already separates routing, UI, utilities, and content concerns clearly.
- Use root scripts instead of ad hoc commands when an existing script already covers the task.
- When changing app behavior, APIs, rendering, config, or dependency wiring, prefer `pnpm test:all:build` before finishing.
- When changing only content or docs, lighter verification is acceptable, but state what was and was not checked.

## Code Style

- TypeScript is strict; avoid introducing `any` unless there is a strong reason.
- Prettier config is in `prettier.config.js`: single quotes, semicolons, 2-space indentation, `printWidth: 100`, `trailingComma: 'none'`.
- Imports are sorted with `@ianvs/prettier-plugin-sort-imports` (order: react → next → third-party → `@/components` → `@/configs` → `@/constants` → `@/` → relative). Run formatting after import-heavy edits.
- ESLint uses flat config (`eslint.config.mjs`) based on `eslint-config-love` + `eslint-config-prettier`. Studio is ignored.
- Use the existing `@/` path aliases (maps to `./src/*`).
- Keep components and utilities consistent with surrounding file patterns instead of introducing a new style locally.

## Testing And Verification

The project has a Vitest test suite in `tests/vitest/` (~37 test files) covering API routes, UI components, AI assistant modules, ingestion, retrieval, auth, schemas, and more. Config is in `vitest.config.ts`. Tests run via `pnpm test:unit` (uses `tsx ./scripts/run-vitest.ts`).

The full automated safety gate is `pnpm test:all`:

1. `pnpm check:format` — Prettier formatting check
2. `pnpm check:lint` — ESLint check
3. `pnpm check:types` — TypeScript type check
4. `pnpm test:unit` — Vitest unit/integration tests

Before concluding substantial code changes:

- Run `pnpm test:all` at minimum for normal app code changes.
- Run `pnpm test:all:build` when changes affect routes, metadata, server code, config, or rendering behavior.
- Run `pnpm studio:build` when changing files inside `studio/`.
- Run `pnpm prisma:generate` after changing `prisma/schema.prisma`.

If you cannot run a relevant check, say so explicitly.

## Studio Notes

- `studio/` is a separate Sanity workspace with its own `package.json`.
- Root ESLint config ignores `studio/**`, so Studio changes are primarily validated through TypeScript/build behavior rather than the root lint task.
- Studio scripts load environment variables from `../.env.local` via `env-cmd`.

## Security And Secrets

- Never print, commit, or rewrite real secret values from `.env.local`.
- Treat all of these as sensitive: `SANITY_API_TOKEN`, `GEMINI_API_KEY`, `CRON_SECRET`, `BLOG_GENERATION_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_VECTOR_REST_TOKEN`, `GITHUB_TOKEN`, `WAKATIME_API_KEY`, `OPENROUTER_API_KEY`, `DATABASE_URL`, `DIRECT_URL`, `AI_REINDEX_SECRET`, `SUPERMEMORY_API_KEY`.
- Preserve server-only boundaries. Do not move secret-dependent logic into client components. AI env validation is in `src/lib/ai/env.ts`.
- Be careful with blog generation, AI chat, reindex, and admin endpoints: they depend on authenticated server-side access and rate limiting.
- Keep logging sanitized and avoid introducing raw secret or personal data output. The logger (`src/lib/logger.ts`) auto-scrubs sensitive keys.

## Pull Requests And Commits

- Keep commit messages short and descriptive, matching the existing history style.
- Do not mix unrelated cleanup with the requested change unless it is necessary to make the change safe.
- Mention any verification you ran and any checks you could not run.

## Agent Guidance

- Prefer the smallest change that satisfies the request.
- Confirm commands and versions against `package.json` and `.github/workflows/tests.yml` before suggesting.
- `next.config.ts` wraps config with `withBotId()` from `botid` — keep this wrapper when modifying Next.js config.
- React Compiler is enabled (`reactCompiler: true` in next.config.ts). Security headers (CSP, X-Frame-Options, etc.) are set in `next.config.ts`.
- Vercel cron in `vercel.json` triggers blog generation at `0 22 * * 2,4,6` (Tue/Thu/Sat 10PM UTC).
- Pre-commit hook (Husky + lint-staged) runs ESLint + Prettier on staged `*.{js,ts,tsx}` files.
- If future package-specific instructions are needed, add nested `AGENTS.md` files rather than overloading this root file.

<!-- BEGIN:nextjs-agent-rules -->

## Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED

Any shell command containing `curl` or `wget` will be intercepted and blocked by the context-mode plugin. Do NOT retry.
Instead use:

- `context-mode_ctx_fetch_and_index(url, source)` to fetch and index web pages
- `context-mode_ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED

Any shell command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` will be intercepted and blocked. Do NOT retry with shell.
Instead use:

- `context-mode_ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### Direct web fetching — BLOCKED

Do NOT use any direct URL fetching tool. Use the sandbox equivalent.
Instead use:

- `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Shell (>20 lines output)

Shell is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:

- `context-mode_ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `context-mode_ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### File reading (for analysis)

If you are reading a file to **edit** it → reading is correct (edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `context-mode_ctx_execute_file(path, language, code)` instead. Only your printed summary enters context.

### grep / search (large results)

Search results can flood context. Use `context-mode_ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `context-mode_ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `context-mode_ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `context-mode_ctx_execute(language, code)` | `context-mode_ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `context-mode_ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `search(source: "label")` later.

## ctx commands

| Command       | Action                                                                            |
| ------------- | --------------------------------------------------------------------------------- |
| `ctx stats`   | Call the `stats` MCP tool and display the full output verbatim                    |
| `ctx doctor`  | Call the `doctor` MCP tool, run the returned shell command, display as checklist  |
| `ctx upgrade` | Call the `upgrade` MCP tool, run the returned shell command, display as checklist |

<!-- rtk-instructions v3 -->
## RTK Command Enforcement

### Mandatory Rule

For any shell command, terminal command, CLI invocation, script execution, package manager command, build command, test command, git command, docker command, or chained command, you MUST prefix each individual command with `rtk`.

This is not optional.

### Required Behavior

- Never output a raw command without `rtk` in front of it.
- Never assume a command is “safe enough” to skip `rtk`.
- Never prefix only the first command in a chained sequence.
- In `&&`, `||`, `;`, subshells, or multiline command blocks, every executable command must be individually prefixed with `rtk`.
- If unsure whether something is a command, treat it as a command and prefix it with `rtk`.

### Transformation Rule

Before outputting any command, rewrite it so that every command invocation is prefixed with `rtk`.

Examples:

```bash
# Wrong
git add .
git commit -m "msg"
git push

# Correct
rtk git add .
rtk git commit -m "msg"
rtk git push
```

```bash
# Wrong
git add . && git commit -m "msg" && git push

# Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

```bash
# Wrong
pnpm install
pnpm run build
pnpm test

# Correct
rtk pnpm install
rtk pnpm run build
rtk pnpm test
```

<!-- rtk-instructions v3 -->