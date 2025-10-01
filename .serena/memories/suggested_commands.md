# Suggested Commands

## Development Commands

```bash
# Start development server
pnpm dev  # or npm run dev

# Build for production
pnpm build  # or npm run build

# Start production server
pnpm start  # or npm run start
```

## Code Quality Commands

```bash
# Run all checks (format, lint, types)
npm run test-all

# Run all checks + build
npm run test-all:build

# Individual checks
npm run check-format     # Prettier format check
npm run check-lint       # ESLint check
npm run check-types      # TypeScript type check

# Auto-fix commands
npm run format           # Auto-format with Prettier
npm run lint            # Auto-fix ESLint issues
```

## Package Management

```bash
# Install dependencies (prefer pnpm)
pnpm install

# Add new dependency
pnpm add <package-name>

# Add dev dependency
pnpm add -D <package-name>
```

## Git Workflow

```bash
# Husky pre-commit hooks automatically run:
# - lint-staged (ESLint + Prettier on staged files)
# - TypeScript type checking

# Manual commit validation
npx lint-staged
npm run check-types
```

## System Commands (macOS)

```bash
# Navigation
ls -la                   # List files with details
find . -name "*.tsx"     # Find TypeScript React files
grep -r "searchTerm" src # Search in source files

# Git operations
git status
git add .
git commit -m "message"
git push origin main
```

## Build & Deploy

```bash
# Local build test
npm run test-all:build

# Sitemap generation (runs automatically after build)
npm run postbuild
```
