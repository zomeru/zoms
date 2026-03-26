# AGENTS.md

## Project Overview

This repository contains a personal portfolio site and AI-assisted technical blog built with Next.js App Router, React, TypeScript, Tailwind CSS, Sanity CMS, and Google Gemini.

The root workspace contains two practical areas:

- The main web app in `src/`
- The Sanity Studio workspace in `studio/`

If nested `AGENTS.md` files are added later, the closest file should take precedence. Until then, this root file applies to both the main app and `studio/`.

## Environment And Tooling

- Use `pnpm` for all package management and scripts.
- Use Node.js 24.x. `package.json`, Volta, and CI all target Node 24.
- Install dependencies from the repository root with `pnpm install`.
- Do not commit secrets or `.env.local`.

## Repository Layout

- `src/app`: Next.js routes, layouts, metadata, API handlers
- `src/components`: UI and client components
- `src/lib`: utilities, data fetching, validation, logging, AI generation, Sanity helpers
- `src/constants`: static content and configuration data
- `public`: static assets
- `studio`: Sanity Studio app and schemas
- `.github/workflows`: CI configuration

## Common Commands

Run these from the repository root unless a subproject-specific workflow requires otherwise:

- `pnpm dev`: start the Next.js app
- `pnpm studio:dev`: start Sanity Studio
- `pnpm check:format`: verify Prettier formatting
- `pnpm format`: apply Prettier formatting
- `pnpm check-lint`: run ESLint without edits
- `pnpm lint`: run ESLint with `--fix`
- `pnpm check-types`: run the TypeScript checker
- `pnpm test:all`: run format, lint, and type checks
- `pnpm build`: build the Next.js app
- `pnpm test:all:build`: run all checks plus build
- `pnpm studio:build`: validate the Studio build

## Development Workflow

- Prefer small, targeted changes that match the existing architecture.
- Read nearby code before editing. The repo already separates routing, UI, utilities, and content concerns clearly.
- Use root scripts instead of ad hoc commands when an existing script already covers the task.
- When changing app behavior, APIs, rendering, config, or dependency wiring, prefer `pnpm test:all:build` before finishing.
- When changing only content or docs, lighter verification is acceptable, but state what was and was not checked.

## Code Style

- TypeScript is strict; avoid introducing `any` unless there is a strong reason.
- Follow Prettier config: single quotes, semicolons, 2-space indentation, 100 character print width, trailing commas disabled.
- Imports are sorted with `@ianvs/prettier-plugin-sort-imports`. Run formatting after import-heavy edits.
- Use the existing `@/` path aliases where appropriate.
- Keep components and utilities consistent with surrounding file patterns instead of introducing a new style locally.

## Testing And Verification

There is no dedicated unit test suite in the root app today. The main automated safety checks are:

- formatting via `pnpm check:format`
- linting via `pnpm check:lint`
- type checking via `pnpm check:types`
- integration/build validation via `pnpm build`

Before concluding substantial code changes:

- Run `pnpm test:all` at minimum for normal app code changes.
- Run `pnpm build` when changes affect routes, metadata, server code, config, or rendering behavior.
- Run `pnpm studio:build` when changing files inside `studio/`.

If you cannot run a relevant check, say so explicitly.

## Studio Notes

- `studio/` is a separate Sanity workspace with its own `package.json`.
- Root ESLint config ignores `studio/**`, so Studio changes are primarily validated through TypeScript/build behavior rather than the root lint task.
- Studio scripts load environment variables from `../.env.local` via `env-cmd`.

## Security And Secrets

- Never print, commit, or rewrite real secret values from `.env.local`.
- Treat `SANITY_API_TOKEN`, `GEMINI_API_KEY`, `CRON_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, `GITHUB_TOKEN`, and `WAKATIME_API_KEY` as sensitive.
- Preserve server-only boundaries. Do not move secret-dependent logic into client components.
- Be careful with blog generation and write endpoints: they depend on authenticated server-side access and rate limiting.
- Keep logging sanitized and avoid introducing raw secret or personal data output.

## Pull Requests And Commits

- Keep commit messages short and descriptive, matching the existing history style.
- Do not mix unrelated cleanup with the requested change unless it is necessary to make the change safe.
- Mention any verification you ran and any checks you could not run.

## Agent Guidance

- Prefer the smallest change that satisfies the request.
- Do not assume the README is fully current; confirm commands and versions against live config such as `package.json` and `.github/workflows`.
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
