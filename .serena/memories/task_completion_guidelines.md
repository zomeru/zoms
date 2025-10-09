# Task Completion Guidelines

## Pre-Push Checklist
Before pushing any changes to the repository, ensure you complete these steps:

### 1. Quality Gates
```bash
pnpm test-all           # Must pass: format + lint + types
```
This command runs:
- Prettier format checking
- ESLint rule validation
- TypeScript type checking

### 2. Build Verification (for significant changes)
```bash
pnpm test-all:build     # Includes quality gates + production build
```

### 3. Manual Testing
- Test the feature in development mode (`pnpm dev`)
- Verify API endpoints work correctly
- Check responsive design on different screen sizes
- Test any new environment variables

## Code Review Requirements

### Documentation Updates
- Update README.md if new features/APIs are added
- Update `.github/copilot-instructions.md` for AI generation changes
- Add comments for complex business logic
- Update environment variable documentation

### Security Considerations
- Ensure no secrets are logged or exposed
- Validate all user inputs with Zod schemas
- Apply rate limiting to new API endpoints
- Use proper error handling with sanitized responses

### Performance Checks
- Verify ISR settings for new data fetching
- Ensure client components are only used when necessary
- Check bundle size impact of new dependencies

## Git Workflow
1. Create feature branch: `git checkout -b feature/description`
2. Make changes following code conventions
3. Run quality gates: `pnpm test-all`
4. Commit with conventional format: `feat: add feature description`
5. Push and create pull request

## Environment Variables
When adding new environment variables:
1. Add to `.env.example` with description
2. Document in README.md environment section
3. Update deployment configuration if needed

## API Changes
For new API endpoints:
1. Add rate limiting configuration
2. Implement proper error handling
3. Add Zod schema validation
4. Update API documentation in README
5. Test with curl or similar tools

## Deployment Checklist
- Ensure all environment variables are set in production
- Verify Sanity Studio access and permissions
- Test AI generation functionality if applicable
- Monitor logs for any runtime errors
- Check performance metrics after deployment