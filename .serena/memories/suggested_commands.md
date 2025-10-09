# Suggested Commands

## Development Commands

### Primary Development
```bash
pnpm dev                 # Start Next.js development server (localhost:3000)
pnpm studio:dev          # Start Sanity Studio locally (localhost:3333)
```

### Quality Assurance
```bash
pnpm test-all           # Run all quality checks (format + lint + types)
pnpm test-all:build     # Run quality checks + production build
pnpm check-types        # TypeScript type checking only
pnpm check-format       # Check Prettier formatting
pnpm check-lint         # Check ESLint rules
pnpm lint               # Run ESLint with auto-fix
pnpm format             # Format code with Prettier
```

### Build & Deployment
```bash
pnpm build              # Production build (includes quality gates)
pnpm start              # Start production server
pnpm studio:build       # Build Sanity Studio
pnpm studio:deploy      # Deploy Sanity Studio
```

### Package Management
```bash
pnpm install            # Install dependencies
pnpm add <package>      # Add new dependency
pnpm add -D <package>   # Add dev dependency
pnpm update             # Update dependencies
```

## Git & Version Control
```bash
git status              # Check working directory status
git add .               # Stage all changes
git commit -m "message" # Commit with message
git push                # Push to remote repository
```

## macOS/Darwin Specific Commands
```bash
ls -la                  # List files with details
find . -name "*.ts"     # Find TypeScript files
grep -r "searchterm"    # Search in files recursively
pbcopy < file.txt       # Copy file contents to clipboard
open .                  # Open current directory in Finder
```

## Environment Setup
```bash
cp .env.example .env.local  # Copy environment template
code .env.local             # Edit environment variables
```

## Debugging & Logs
```bash
pnpm dev 2>&1 | tee dev.log     # Log development output
tail -f .next/trace             # Follow Next.js trace logs
```

## Pre-commit Quality Gates
The project automatically runs these on commit via Husky:
- ESLint with auto-fix on staged files
- Prettier formatting on staged files

## Important Notes
- Always run `pnpm test-all` before pushing to ensure code quality
- Use `pnpm studio:dev` when working with dynamic content
- Environment variables must be configured in `.env.local` for full functionality