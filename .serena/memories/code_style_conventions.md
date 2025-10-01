# Code Style and Conventions

## TypeScript Configuration

- Strict TypeScript with all type checking enabled
- Target: ES6, Module: ESNext
- Path alias: `@/*` maps to `./src/*`
- No implicit returns, unreachable code, or fallthrough cases

## ESLint Configuration

- Extends: Prettier, Standard-with-TypeScript, Next.js
- Custom rules:
  - Semi disabled for TypeScript
  - Space before function parentheses disabled
  - Member delimiter style disabled
  - Template expression restrictions disabled

## Prettier Configuration

- Single quotes for JS/JSX
- No trailing commas
- Tab width: 2 spaces
- Print width: 100 characters
- Semicolons enabled
- Bracket spacing enabled

## Naming Conventions

- **Components**: PascalCase (e.g., `MainInfo`, `MouseFollower`)
- **Files**: PascalCase for components, camelCase for utilities
- **Constants**: camelCase for exports, UPPER_CASE for internal constants
- **CSS Classes**: Tailwind utility classes

## File Organization

- Components use default exports with barrel exports in `index.ts`
- Constants are grouped by domain (experience, projects, other)
- Configs are separated by concern (SEO, app config)
- Type annotations use React.JSX.Element for components

## Component Patterns

- Functional components with explicit return types
- Props destructuring in function parameters
- Fragment usage for multiple children
- Conditional rendering with logical operators

## Import/Export Patterns

- Barrel exports for cleaner imports (`@/components`, `@/constants`)
- Absolute imports using `@/` path alias
- Default exports for components, named exports for utilities
