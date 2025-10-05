# Blog Feature Documentation

This document describes the blog feature implementation in the Zoms portfolio.

## Overview

The blog system includes:

- **Sanity CMS** backend for content management
- **Gemini AI** integration for automatic weekly blog post generation
- **SEO-optimized** blog pages with full metadata support
- **Syntax highlighting** for code blocks
- **Pagination** with load more functionality
- **Vercel Cron** for weekly automated content generation

## Architecture

### Sanity Schemas

Located in `studio/schemas/`:

1. **blogPost.ts** - Main blog post document type
   - Fields: title, slug, summary, body, publishedAt, modifiedAt, tags, source, generated
   - Supports both manual and AI-generated content

2. **blogPostBlockContent.ts** - Rich text content with code block support
   - Supports: headings (H1-H4), paragraphs, lists, links, inline code, code blocks
   - Multiple programming languages for syntax highlighting

### Data Layer

Located in `src/lib/`:

1. **blog.ts** - Blog data fetching functions
   - `getBlogPosts()` - Fetch paginated blog posts
   - `getBlogPostBySlug()` - Fetch single blog post
   - `getLatestBlogPosts()` - Fetch latest N posts for home page
   - `getBlogPostCount()` - Get total post count

2. **generateBlog.ts** - AI content generation
   - `fetchTrendingTopics()` - Get topics from trending sources
   - `generateBlogContent()` - Generate content using Gemini AI
   - `markdownToBlocks()` - Convert markdown to Sanity blocks

### API Routes

Located in `src/app/api/blog/`:

1. **route.ts** - GET `/api/blog`
   - Returns paginated list of blog posts
   - Query params: `limit` (default 25), `offset` (default 0)

2. **[slug]/route.ts** - GET `/api/blog/[slug]`
   - Returns single blog post by slug

3. **generate/route.ts** - POST `/api/blog/generate`
   - Protected endpoint for AI blog generation
   - Called by Vercel Cron weekly
   - Requires `BLOG_GENERATION_SECRET` for authentication

### UI Components

1. **Home Page Blog Section** - `src/components/Sections/Blog.tsx`
   - Shows latest 3 blog posts
   - Links to full blog page

2. **Blog Listing Page** - `src/app/blog/page.tsx`
   - Server component for initial render
   - Uses `BlogListClient.tsx` for pagination
   - Load more buttons at top and bottom

3. **Blog Post Detail Page** - `src/app/blog/[slug]/page.tsx`
   - Full blog post with SEO metadata
   - Uses `BlogContent.tsx` for rendering
   - Syntax highlighted code blocks

## Configuration

### Environment Variables

Required in `.env.local` and Vercel:

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_write_token

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Blog Generation
BLOG_GENERATION_SECRET=your_random_secret
```

### Vercel Cron Job

Configured in `vercel.json`:

- Runs every Monday at 10:00 AM UTC
- Calls `/api/blog/generate`
- Uses `x-vercel-cron-secret` header for authentication

## Content Management

### Using Sanity Studio

1. Start the studio:

   ```bash
   pnpm studio:dev
   ```

2. Open http://localhost:3333

3. Create/edit blog posts with:
   - Rich text editor with code blocks
   - Tag management
   - SEO-friendly summaries
   - Publishing dates

### Manual Blog Posts

1. Set `source` to "manual"
2. Set `generated` to false
3. Write content in the rich text editor

### AI-Generated Posts

Generated automatically by cron job, or manually trigger:

```bash
curl -X POST https://your-domain.com/api/blog/generate \
  -H "Authorization: Bearer YOUR_SECRET"
```

## SEO Features

- Dynamic metadata for each blog post
- Open Graph tags for social sharing
- Twitter Card support
- Structured data (article schema)
- Canonical URLs
- Sitemap integration (via next-sitemap)

## Styling

- Follows existing portfolio design system
- Uses Tailwind CSS v4
- Responsive design (mobile-first)
- Syntax highlighting with `react-syntax-highlighter`
- Dark theme optimized

## Accessibility

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Focus states for interactive elements
- Alt text support (can be added to images in future)

## Future Enhancements

Potential improvements:

- Image support in blog posts
- Search functionality
- Categories/tags filtering
- RSS feed generation
- Reading time estimation
- Related posts suggestions
- Social media share buttons
- Comments system integration
- Better topic scraping from actual sources

## Troubleshooting

### Blog posts not showing

1. Check Sanity connection (environment variables)
2. Verify blog posts exist in Sanity Studio
3. Check browser console for errors

### AI generation failing

1. Verify `GEMINI_API_KEY` is set correctly
2. Check `SANITY_API_TOKEN` has write permissions
3. View logs in Vercel dashboard

### Build errors

1. Run `npm run test-all` to check for linting/type errors
2. Ensure all dependencies are installed: `pnpm install`
3. Check for network issues (Google Fonts, etc.)

## Development Workflow

1. Install dependencies: `pnpm install`
2. Set up environment variables in `.env.local`
3. Run development server: `pnpm dev`
4. Start Sanity Studio: `pnpm studio:dev`
5. Test locally before deploying

## Deployment Checklist

- [ ] Set all environment variables in Vercel
- [ ] Test blog generation endpoint manually
- [ ] Verify cron job is configured
- [ ] Check SEO metadata renders correctly
- [ ] Test responsive design on mobile devices
- [ ] Verify syntax highlighting works
- [ ] Test pagination and load more
- [ ] Check all links work correctly
