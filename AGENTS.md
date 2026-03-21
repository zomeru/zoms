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
- `pnpm check-format`: verify Prettier formatting
- `pnpm format`: apply Prettier formatting
- `pnpm check-lint`: run ESLint without edits
- `pnpm lint`: run ESLint with `--fix`
- `pnpm check-types`: run the TypeScript checker
- `pnpm test-all`: run format, lint, and type checks
- `pnpm build`: build the Next.js app
- `pnpm test-all:build`: run all checks plus build
- `pnpm studio:build`: validate the Studio build

## Development Workflow

- Prefer small, targeted changes that match the existing architecture.
- Read nearby code before editing. The repo already separates routing, UI, utilities, and content concerns clearly.
- Use root scripts instead of ad hoc commands when an existing script already covers the task.
- When changing app behavior, APIs, rendering, config, or dependency wiring, prefer `pnpm test-all:build` before finishing.
- When changing only content or docs, lighter verification is acceptable, but state what was and was not checked.

## Code Style

- TypeScript is strict; avoid introducing `any` unless there is a strong reason.
- Follow Prettier config: single quotes, semicolons, 2-space indentation, 100 character print width, trailing commas disabled.
- Imports are sorted with `@ianvs/prettier-plugin-sort-imports`. Run formatting after import-heavy edits.
- Use the existing `@/` path aliases where appropriate.
- Keep components and utilities consistent with surrounding file patterns instead of introducing a new style locally.

## Testing And Verification

There is no dedicated unit test suite in the root app today. The main automated safety checks are:

- formatting via `pnpm check-format`
- linting via `pnpm check-lint`
- type checking via `pnpm check-types`
- integration/build validation via `pnpm build`

Before concluding substantial code changes:

- Run `pnpm test-all` at minimum for normal app code changes.
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
