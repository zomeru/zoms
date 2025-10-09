# Code Style and Conventions

## TypeScript Configuration
- **Strict mode enabled** - All TypeScript strict checks are enforced
- **No implicit returns** - Functions must explicitly return values
- **No fallthrough cases** - Switch statements must have breaks
- **Force consistent casing** - File names must be consistent
- **Path aliases** - `@/*` maps to `./src/*` for clean imports

## ESLint Configuration
- Based on **eslint-config-love** for strict TypeScript rules
- **Prettier integration** - Consistent formatting enforced
- **Custom rule relaxations**:
  - No magic numbers restriction
  - No explicit function return types required
  - No strict boolean expressions
  - React JSX scope not required (Next.js handles this)

## Naming Conventions
- **Components**: PascalCase (e.g., `BlogContent.tsx`)
- **Files**: camelCase for utilities, PascalCase for components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for environment variables
- **Types/Interfaces**: PascalCase

## Import Organization
- **Automatic sorting** via `@ianvs/prettier-plugin-sort-imports`
- **Path aliases** preferred over relative imports
- **No manual import grouping** - let Prettier handle organization

## Component Architecture
- **Server Components by default** - Use `'use client'` only when needed
- **Client components only for**:
  - Event handlers
  - Browser APIs
  - React hooks (useState, useEffect, etc.)
  - Interactive features

## Error Handling
- **Centralized error handling** via `errorHandler.ts`
- **Custom ApiError class** for structured API errors
- **Zod validation** for all API inputs and outputs
- **Environment-aware error messages** (detailed in dev, sanitized in prod)

## Logging
- **Custom logger** instead of console statements
- **Structured logging** in production (JSON format)
- **PII sanitization** - automatic removal of sensitive data
- **Log levels**: trace, debug, info, warn, error, fatal

## Code Organization
- **Modular utilities** in `src/lib/`
- **Pure functions preferred** - avoid side effects where possible
- **Constants** separated into `src/constants/`
- **Type definitions** co-located or in separate `.types.ts` files

## Performance Guidelines
- **ISR with 60s revalidation** for Sanity data
- **Server-side data fetching** preferred over client-side
- **Minimal client-side JavaScript** - leverage server components