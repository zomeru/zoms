# Task Completion Workflow

## Development Process

### 1. Setup and Configuration

- **Environment Setup**: Ensure `.env.local` contains required variables (Sanity, Gemini, Upstash Redis)
- **Dependency Management**: Use `pnpm` for all package operations (v10.17.1+)
- **Studio Setup**: Run `pnpm studio:dev` for content management tasks
- **Validation**: Run `pnpm test-all` to ensure clean starting state

### 2. Content Management Tasks

#### Static Content Updates

- **Projects**: Modify `src/constants/projects.ts`
- **Tech Stack**: Update `src/constants/other.ts`
- **Personal Info**: Edit constants in `src/constants/other.ts`
- **Blog Topics**: Manage AI topics in `src/constants/topics.ts`

#### Dynamic Content Updates

- **Experience**: Use Sanity Studio at `localhost:3333` or production studio
- **Blog Posts**: Manual creation in Studio or AI generation via `/blog` page
- **Schema Changes**: Modify schemas in `studio/schemas/` and redeploy studio

### 3. Feature Development

#### Component Development

1. Create component in appropriate `src/components/` subdirectory
2. Follow TypeScript strict mode conventions with `React.JSX.Element` return type
3. Add to barrel export in relevant `index.ts`
4. Import using `@/components` path alias
5. Use TailwindCSS v4 patterns with CSS variables

#### API Development

1. Create route handlers in `src/app/api/`
2. Implement Zod schema validation for all inputs
3. Add rate limiting using `rateLimitMiddleware`
4. Use centralized error handling with `handleApiError`
5. Add structured logging with `log` utility
6. Consider ISR implications for data mutations

#### Styling Updates

1. Use TailwindCSS v4 utility classes with semantic color names
2. Define custom utilities in `src/styles/globals.css` if needed
3. Follow established responsive patterns (`lg:` breakpoints)
4. Test mobile-first approach thoroughly

### 4. Blog System Workflow

#### Manual Blog Creation

1. Access Sanity Studio via `pnpm studio:dev`
2. Create new blog post with required fields (title, slug, summary, body)
3. Use rich text editor with code block support
4. Set tags, publication date, and metadata
5. Publish when ready (appears via ISR within 60 seconds)

#### AI Blog Generation

1. Navigate to `/blog` page in development or production
2. Use "Generate Blog with AI" button
3. System automatically:
   - Selects next topic from rotation list
   - Generates content using Gemini AI
   - Creates properly formatted Sanity document
   - Publishes post with AI generation metadata

#### Blog Topic Management

- **Topic List**: Maintained in `src/constants/topics.ts`
- **Rotation Logic**: Automatic cycling through technical topics
- **Customization**: Add/remove topics based on content strategy

### 5. Quality Assurance

#### Pre-commit Validation (Automatic)

- **Husky Integration**: Runs lint-staged on commit
- **Prettier**: Auto-formats staged files
- **ESLint**: Auto-fixes common issues
- **TypeScript**: Validates types before commit

#### Manual Validation Commands

```bash
pnpm test-all          # Format + lint + types
pnpm test-all:build    # Full validation + build
pnpm check-types       # TypeScript only
pnpm format           # Prettier formatting
pnpm lint             # ESLint with auto-fix
```

#### Build Validation

- **Production Build**: Must pass before deployment
- **Sitemap Generation**: Automatic post-build via `next-sitemap`
- **Type Safety**: Zero TypeScript errors required
- **Bundle Analysis**: Monitor build output for size optimization

### 6. Deployment Process

#### Frontend Deployment

1. **Validation**: Run `pnpm test-all:build` locally
2. **Push to Main**: Triggers automatic Vercel deployment
3. **ISR Activation**: Incremental updates enabled automatically
4. **Analytics**: Vercel Analytics and Speed Insights auto-included

#### Studio Deployment

```bash
cd studio
pnpm deploy
```

- **Schema Changes**: Deploy after modifying content schemas
- **Environment Variables**: Inherited from parent project
- **URL Configuration**: Auto-configured for production domain

#### Content Updates Post-Deployment

- **Immediate**: Changes in Studio reflect within 60 seconds via ISR
- **Static Content**: Requires redeployment for constant updates
- **Cache Invalidation**: Automatic via Next.js ISR mechanism

### 7. Advanced Features Management

#### Rate Limiting Configuration

- **Development**: In-memory rate limiting with configurable limits
- **Production**: Upstash Redis with graceful fallback
- **Endpoints**: Different limits for blog generation vs standard API
- **Monitoring**: Structured logging of rate limit events

#### Error Handling and Logging

- **Centralized**: All errors flow through `handleApiError`
- **Environment Aware**: Detailed dev errors, sanitized production errors
- **Structured Logging**: JSON format for production, pretty format for dev
- **PII Protection**: Automatic sanitization of sensitive data

#### AI Content Generation

- **Topic Rotation**: Intelligent cycling through curated technical topics
- **Quality Control**: Structured prompts ensure consistent content quality
- **Fallback Handling**: Graceful degradation if AI service unavailable
- **Metadata Tracking**: Full audit trail for generated content

### 8. Maintenance Tasks

#### Regular Maintenance

- **Dependencies**: Monthly updates via `pnpm update`
- **Security**: Monitor GitHub Dependabot alerts and fix promptly
- **Performance**: Review Vercel Speed Insights monthly
- **Content**: Review AI-generated posts for quality and accuracy
- **Logs**: Monitor structured logs for performance and error patterns

#### Troubleshooting Workflow

1. **Check Logs**: Review structured logs for error patterns
2. **Validate Environment**: Ensure all required environment variables set
3. **Test Locally**: Reproduce issues in development environment
4. **Check Dependencies**: Run `pnpm audit` for security issues
5. **Cache Clearing**: Clear Next.js cache with `rm -rf .next`

#### Performance Optimization

- **ISR Tuning**: Adjust revalidation times based on content update frequency
- **Bundle Monitoring**: Use build output to identify large dependencies
- **Image Optimization**: Ensure all images use Next.js Image component
- **API Performance**: Monitor response times and optimize queries

### 9. Emergency Procedures

#### Content Rollback

- **Blog Posts**: Unpublish in Sanity Studio or delete via API
- **Experience**: Edit directly in Studio interface
- **Static Content**: Deploy hotfix via git revert
- **Schema Issues**: Revert studio deployment to previous version

#### Service Recovery

- **Sanity Outage**: Automatic fallback to constants data
- **Build Issues**: Revert to last known good commit
- **API Failures**: Check environment variables and service status
- **Rate Limiting**: Adjust limits or temporarily disable if needed

#### Data Recovery

- **Sanity Backup**: Use Sanity's built-in backup features
- **Git History**: Leverage git history for static content recovery
- **Environment Variables**: Maintain secure backup of all credentials
- **Studio Configuration**: Keep studio config in version control

### 10. Development Best Practices

#### Code Quality

- **TypeScript Strict**: All code must pass strict type checking
- **Error Boundaries**: Implement for critical user-facing components
- **Input Validation**: Use Zod schemas for all API inputs
- **Security**: Sanitize all user inputs and log data

#### Performance Guidelines

- **ISR Usage**: Leverage for all dynamic content where appropriate
- **Bundle Size**: Monitor and optimize for performance
- **API Efficiency**: Minimize database queries and API calls
- **Caching Strategy**: Use appropriate caching for different content types

#### Testing Strategy

- **Manual Testing**: Test all features in both development and production
- **API Testing**: Validate all endpoints with various input scenarios
- **Responsive Testing**: Ensure functionality across device sizes
- **Accessibility**: Verify keyboard navigation and screen reader compatibility

#### Documentation Updates

- **README**: Keep installation and setup instructions current
- **API Documentation**: Document all endpoint changes
- **Environment Variables**: Update .env.example with new variables
- **Deployment Notes**: Document any deployment-specific configuration
