# Suggested Commands

## Development Commands

### Core Development

```bash
# Start development servers
pnpm dev                    # Next.js development server (localhost:3000)
pnpm studio:dev            # Sanity Studio (localhost:3333)

# Build and validation
pnpm build                 # Production build with validation
pnpm test-all              # Format + lint + type check
pnpm test-all:build        # Full validation + build test

# Formatting and linting
pnpm format               # Format all files with Prettier
pnpm lint                 # ESLint with auto-fix
pnpm check-types          # TypeScript validation only
```

### Content Management

```bash
# Sanity Studio operations
pnpm studio:dev           # Local studio development
pnpm studio:build         # Build studio for deployment
pnpm studio:deploy        # Deploy studio to Sanity hosting

# Content-related development
cd studio && pnpm dev     # Alternative studio start command
```

### Package Management

```bash
# Installation and updates
pnpm install              # Install all dependencies
pnpm update               # Update all packages
pnpm add <package>        # Add new dependency
pnpm add -D <package>     # Add dev dependency

# Workspace-specific
cd studio && pnpm install # Install studio dependencies only
```

### Production and Deployment

```bash
# Production builds
pnpm build                # Build with pre-build validation
pnpm start                # Start production server
pnpm postbuild            # Generate sitemap (auto-runs after build)

# Deployment preparation
pnpm test-all:build       # Full validation before deploy
```

## Environment Setup Commands

### Initial Setup

```bash
# Clone and setup
git clone <repository>
cd zoms
pnpm install

# Environment configuration
cp .env.example .env.local
# Edit .env.local with Sanity and Gemini credentials

# Start development
pnpm dev
pnpm studio:dev           # In separate terminal
```

### Sanity Integration

```bash
# Studio setup and deployment
cd studio
pnpm install
pnpm dev                  # Test studio locally
pnpm deploy               # Deploy to Sanity hosting
```

## Troubleshooting Commands

### Common Issues

```bash
# Clear caches and reinstall
rm -rf node_modules pnpm-lock.yaml
rm -rf studio/node_modules studio/pnpm-lock.yaml
pnpm install

# Force clean build
rm -rf .next
pnpm build

# Type checking
pnpm check-types          # Find TypeScript errors
```

### Debug Information

```bash
# Check environment
node --version            # Should be 18+
pnpm --version           # Should be 10.17.1+
pnpm list                # Show dependency tree

# Verify build assets
ls -la .next/static      # Check build artifacts
ls -la public/           # Check static assets and sitemap
```

### Performance and Analysis

```bash
# Build analysis
pnpm build               # Check build output and warnings
npx @next/bundle-analyzer # Analyze bundle size (if configured)

# Dependency analysis
pnpm audit               # Security audit
pnpm outdated            # Check for outdated packages
```

## Git and Version Control

```bash
# Pre-commit validation (automatic via Husky)
git add .
git commit -m "message"  # Triggers lint-staged automatically

# Manual validation
pnpm test-all           # Run same checks as pre-commit

# Branch management
git checkout -b feature/new-feature
git push -u origin feature/new-feature
```

## Content Management Workflow

```bash
# Studio workflow
pnpm studio:dev         # Start studio
# Navigate to localhost:3333
# Edit content in browser
# Changes auto-sync with development site

# Blog generation workflow
# Navigate to localhost:3000/blog
# Use "Generate New Post" button for AI content
# Or create manually in Studio
```

## Monitoring and Maintenance

```bash
# Regular maintenance
pnpm update             # Monthly dependency updates
pnpm audit fix          # Fix security vulnerabilities
pnpm test-all:build     # Validate everything still works

# Performance monitoring
# Check Vercel dashboard for Speed Insights
# Monitor ISR revalidation in production logs
```
