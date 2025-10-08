# Suggested Commands

## Development Commands

### Core Development

```bash
# Start development servers
pnpm dev                    # Next.js development server (localhost:3000)
pnpm studio:dev            # Sanity Studio (localhost:3333)

# Build and validation
pnpm build                 # Production build with pre-validation
pnpm test-all              # Format + lint + type check
pnpm test-all:build        # Full validation + build test

# Formatting and linting
pnpm format               # Format all files with Prettier
pnpm lint                 # ESLint with auto-fix
pnpm check-types          # TypeScript validation only
pnpm check-format         # Check Prettier formatting
pnpm check-lint           # Check ESLint rules
```

### Content Management

```bash
# Sanity Studio operations
pnpm studio:dev           # Local studio development
pnpm studio:build         # Build studio for deployment
pnpm studio:deploy        # Deploy studio to Sanity hosting

# Content-related development
cd studio && pnpm dev     # Alternative studio start command
cd studio && pnpm install # Install studio dependencies
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
pnpm install --frozen-lockfile # Production install (CI/CD)
```

### Production and Deployment

```bash
# Production builds
pnpm build                # Build with pre-validation
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
# Edit .env.local with required credentials

# Start development
pnpm dev                  # Frontend
pnpm studio:dev          # CMS (separate terminal)
```

### Sanity Integration

```bash
# Studio setup and deployment
cd studio
pnpm install
pnpm dev                  # Test studio locally
pnpm deploy               # Deploy to Sanity hosting
```

### Environment Variables Setup

```bash
# Required for basic functionality
export NEXT_PUBLIC_SANITY_PROJECT_ID="your_project_id"
export NEXT_PUBLIC_SANITY_DATASET="production"
export SANITY_API_TOKEN="your_write_token"

# Optional for AI blog generation
export GEMINI_API_KEY="your_gemini_api_key"

# Optional for enhanced rate limiting
export UPSTASH_REDIS_REST_URL="your_redis_url"
export UPSTASH_REDIS_REST_TOKEN="your_redis_token"

# Optional logging configuration
export LOG_LEVEL="debug"              # trace, debug, info, warn, error, fatal
export NEXLOG_STRUCTURED="true"       # Enable structured JSON logging
```

## Troubleshooting Commands

### Common Issues

```bash
# Clear caches and reinstall
rm -rf node_modules pnpm-lock.yaml
rm -rf studio/node_modules studio/pnpm-lock.yaml
rm -rf .next
pnpm install

# Force clean build
rm -rf .next
pnpm build

# Type checking issues
pnpm check-types          # Find TypeScript errors
tsc --noEmit --listFiles  # List all included files
```

### Debug Information

```bash
# Check environment
node --version            # Should be 18+
pnpm --version           # Should be 10.17.1+
pnpm list                # Show dependency tree
pnpm list --depth=0      # Show top-level dependencies

# Verify build assets
ls -la .next/static      # Check build artifacts
ls -la public/           # Check static assets and sitemap
```

### Performance and Analysis

```bash
# Build analysis
pnpm build               # Check build output and warnings
ANALYZE=true pnpm build  # Bundle analysis (if configured)

# Dependency analysis
pnpm audit               # Security audit
pnpm outdated            # Check for outdated packages
pnpm why <package>       # Show why package is installed
```

## Git and Version Control

```bash
# Pre-commit validation (automatic via Husky)
git add .
git commit -m "message"  # Triggers lint-staged automatically

# Manual validation (same as pre-commit)
pnpm test-all           # Run format, lint, and type checks

# Branch management
git checkout -b feature/new-feature
git push -u origin feature/new-feature

# Release preparation
pnpm test-all:build     # Full validation
git tag v1.0.0
git push origin v1.0.0
```

## Content Management Workflow

```bash
# Studio workflow
pnpm studio:dev         # Start studio (localhost:3333)
# Navigate to localhost:3333 in browser
# Edit content through UI
# Changes auto-sync with development site via ISR

# Blog generation workflow
# Navigate to localhost:3000/blog
# Use "Generate Blog with AI" button for automated content
# Or create manually in Studio interface

# Content deployment
pnpm studio:deploy      # Deploy studio changes
# Frontend auto-updates via ISR (60-second revalidation)
```

## API Development and Testing

```bash
# Test API endpoints locally
curl http://localhost:3000/api/blog
curl http://localhost:3000/api/blog/test-post
curl -X POST http://localhost:3000/api/blog/generate \
  -H "Content-Type: application/json" \
  -d '{"aiGenerated": true}'

# Check API logs
pnpm dev                # Watch console for structured logs
LOG_LEVEL=debug pnpm dev # Enable debug logging
```

## Monitoring and Maintenance

```bash
# Regular maintenance
pnpm update             # Monthly dependency updates
pnpm audit fix          # Fix security vulnerabilities
pnpm test-all:build     # Validate everything works

# Performance monitoring
# Check Vercel dashboard for:
# - Speed Insights data
# - Analytics metrics
# - Function execution logs
# - ISR cache hit rates

# Log monitoring
LOG_LEVEL=info pnpm start    # Production logging
NEXLOG_STRUCTURED=true pnpm start # JSON logs for parsing
```

## Development Workflow Commands

### Feature Development

```bash
# Start new feature
git checkout -b feature/blog-improvements
pnpm dev                # Start development
pnpm studio:dev         # Start studio (if content changes needed)

# During development
pnpm test-all          # Frequent validation
pnpm format            # Format code
pnpm lint              # Fix linting issues

# Before commit
pnpm test-all:build    # Full validation
git add .
git commit -m "feat: improve blog functionality"
```

### Content Updates

```bash
# Static content updates
# Edit files in src/constants/
pnpm test-all          # Validate changes
git commit -m "content: update project information"

# Dynamic content updates
pnpm studio:dev        # Edit via Sanity Studio
# Changes reflect automatically via ISR

# AI content generation
# Use web interface at /blog
# Or trigger programmatically via API
```

### Deployment Workflow

```bash
# Pre-deployment validation
pnpm test-all:build    # Must pass for deployment

# Deploy studio (if schema changes)
cd studio
pnpm deploy

# Deploy frontend
git push origin main   # Triggers Vercel deployment
# Or manual deployment:
vercel deploy --prod

# Post-deployment verification
curl https://zoms.vercel.app/api/blog  # Test API
# Check Vercel dashboard for deployment status
```

## Emergency and Recovery Commands

### Content Recovery

```bash
# Rollback studio deployment
cd studio
git log --oneline      # Find last good commit
git checkout <commit-hash>
pnpm deploy           # Deploy previous version

# Clear Next.js cache
rm -rf .next
pnpm build            # Force rebuild
```

### Service Recovery

```bash
# Restart development servers
pkill -f "next dev"   # Kill Next.js dev server
pkill -f "sanity dev" # Kill Sanity dev server
pnpm dev              # Restart Next.js
pnpm studio:dev       # Restart Studio

# Reset environment
unset $(grep -v '^#' .env.local | sed -E 's/(.*)=.*/\1/' | xargs)
source .env.local     # Reload environment variables
```

### Debug Production Issues

```bash
# Local production build
pnpm build
pnpm start            # Test production build locally

# Analyze production logs
# Check Vercel function logs
# Monitor structured logs in production

# Test API endpoints in production
curl https://zoms.vercel.app/api/blog
curl -H "Authorization: Bearer <token>" \
  https://zoms.vercel.app/api/blog/generate
```
