# Task Completion Workflow

## Development Process

### 1. Setup and Configuration

- **Environment Setup**: Ensure `.env.local` contains Sanity and Gemini API credentials
- **Dependency Management**: Use `pnpm` for all package operations
- **Studio Setup**: Run `pnpm studio:dev` for content management tasks

### 2. Content Management Tasks

#### Static Content Updates

- **Projects**: Modify `src/constants/projects.ts`
- **Tech Stack**: Update `src/constants/other.ts`
- **Personal Info**: Edit constants in `src/constants/other.ts`

#### Dynamic Content Updates

- **Experience**: Use Sanity Studio at `localhost:3333` or production studio
- **Blog Posts**: Either manual creation in Studio or AI generation via `/blog` page
- **Schema Changes**: Modify schemas in `studio/schemas/` and redeploy studio

### 3. Feature Development

#### Component Development

1. Create component in appropriate `src/components/` subdirectory
2. Add to barrel export in relevant `index.ts`
3. Import using `@/components` path alias
4. Follow TypeScript strict mode conventions

#### API Development

1. Create route handlers in `src/app/api/`
2. Use Next.js 15 App Router patterns
3. Implement error handling and type safety
4. Consider ISR implications for data mutations

#### Styling Updates

1. Use Tailwind v4 utility classes
2. Follow established color scheme (`primary`, `backgroundPrimary`, etc.)
3. Maintain responsive design patterns (`lg:` breakpoints)
4. Test mobile-first approach

### 4. Blog System Workflow

#### Manual Blog Creation

1. Access Sanity Studio
2. Create new blog post with required fields
3. Use rich text editor for content
4. Set tags and metadata
5. Publish when ready

#### AI Blog Generation

1. Navigate to `/blog` page
2. Use "Generate New Post" button
3. System automatically:
   - Rotates through topic list
   - Generates content with Gemini AI
   - Creates Sanity document
   - Publishes post

#### Blog Topic Management

- **Topic List**: Maintained in `src/constants/topics.ts`
- **Rotation Logic**: Automatic cycling through topics
- **Customization**: Add/remove topics as needed

### 5. Quality Assurance

#### Pre-commit Validation

- **Automatic**: Husky runs lint-staged on commit
- **Format**: Prettier auto-formatting
- **Lint**: ESLint with auto-fix
- **Types**: TypeScript validation

#### Testing Commands

```bash
pnpm test-all          # Format + lint + types
pnpm test-all:build    # Full validation + build
```

#### Build Validation

- **Production Build**: Must pass before deployment
- **Sitemap Generation**: Automatic post-build
- **Type Safety**: Zero TypeScript errors required

### 6. Deployment Process

#### Frontend Deployment

1. Push to main branch triggers Vercel deployment
2. Build process includes validation steps
3. ISR enables incremental updates
4. Analytics automatically included

#### Studio Deployment

```bash
cd studio
pnpm deploy
```

#### Content Updates

- **Immediate**: Changes in Studio reflect in 60 seconds (ISR)
- **Build-time**: Static content requires redeployment

### 7. Maintenance Tasks

#### Regular Maintenance

- **Dependencies**: Update monthly using `pnpm update`
- **Security**: Monitor GitHub Dependabot alerts
- **Performance**: Check Vercel Speed Insights
- **Content**: Review AI-generated blog posts for quality

#### Troubleshooting

- **Build Failures**: Check TypeScript errors and linting issues
- **Content Issues**: Verify Sanity connection and schema consistency
- **Performance**: Monitor ISR revalidation and API response times

### 8. Emergency Procedures

#### Content Rollback

- **Blog Posts**: Unpublish in Sanity Studio
- **Experience**: Edit directly in Studio
- **Static Content**: Deploy hotfix via git

#### Service Recovery

- **Sanity Outage**: Fallback to constants data
- **Build Issues**: Revert to last known good commit
- **API Failures**: Check environment variables and service status
