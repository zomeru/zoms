# Zoms - Portfolio & Blog

Modern, responsive portfolio website for Zomer Gregorio featuring dynamic content management, AI-powered blog generation, and enterprise-grade features including rate limiting, structured logging, and comprehensive error handling.

🌐 **Live Site**: [zoms.vercel.app](https://zoms.vercel.app)

## ✨ Features

### Core Portfolio Features

- **🎨 Modern Design**: Dark theme with purple accents and smooth animations
- **📱 Fully Responsive**: Mobile-first design with elegant two-column desktop layout
- **⚡ Performance Optimized**: Next.js 15 with ISR and Vercel Speed Insights
- **🎯 SEO Optimized**: Comprehensive metadata, Open Graph, and automatic sitemaps
- **🔍 Type Safe**: Full TypeScript coverage with strict configuration

### Advanced Blog System

- **🤖 AI-Powered Blog**: Automatic content generation using Google Gemini AI
- **📝 Content Management**: Dynamic content via Sanity CMS with live preview
- **💻 Syntax Highlighting**: Beautiful code blocks with React Syntax Highlighter
- **📖 Markdown Rendering**: GitHub-flavored markdown with unified.js and react-markdown
- **🔄 Topic Rotation**: Intelligent cycling through curated technical topics
- **📊 Content Analytics**: Track AI-generated vs manually created posts
- **🎨 Rich Formatting**: Support for tables, task lists, blockquotes, and inline code

### Enterprise Features

- **🛡️ Rate Limiting**: Redis-backed with in-memory fallback for API protection
- **📋 Structured Logging**: Edge Runtime-compatible with GDPR compliance
- **🔧 Error Handling**: Centralized error management with environment-aware responses
- **✅ Input Validation**: Zod schemas for type-safe API validation
- **🔒 Security**: Comprehensive input sanitization and PII protection

### Developer Experience

- **🔧 Modern Tooling**: ESLint, Prettier, and Husky pre-commit hooks
- **📦 Package Management**: pnpm with workspace support
- **🎨 TailwindCSS v4**: Modern styling with CSS variables and custom utilities
- **🔥 Hot Reload**: Fast development with Next.js and Sanity Studio integration

## 🛠️ Tech Stack

### Frontend & Framework

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.9.3
- **Styling**: TailwindCSS v4.1.14 with modern `@theme` directive
- **UI Components**: React 19.2.0
- **Package Manager**: pnpm 10.17.1

### Content & AI

- **CMS**: Sanity (@sanity/client 7.12.0)
- **AI**: Google Gemini API (@google/generative-ai 0.24.1)
- **Markdown Processing**: Unified.js ecosystem (remark-parse, remark-gfm, rehype-stringify)
- **Markdown Rendering**: react-markdown with GFM support
- **Syntax Highlighting**: React Syntax Highlighter with Prism
- **Image Optimization**: Sanity Image URLs with Next.js optimization

### Enterprise Features

- **Validation**: Zod 4.1.12 for schema validation
- **Rate Limiting**: Upstash Redis (@upstash/ratelimit 2.0.6) with fallback
- **Logging**: Custom Edge Runtime-compatible logger
- **Error Handling**: Centralized error management system

### Development & Analytics

- **Analytics**: Vercel Analytics & Speed Insights
- **Linting**: ESLint with TypeScript and Promise rules
- **Formatting**: Prettier with import sorting
- **Git Hooks**: Husky for pre-commit validation
- **Notifications**: React Hot Toast with custom styling

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 22+ (recommended: latest LTS)
- **pnpm**: 10.17.1+ (`npm install -g pnpm@latest-10`)
- **Sanity Account**: Free tier available at [sanity.io](https://sanity.io)

### Installation

1. **Clone and install dependencies:**

```bash
git clone https://github.com/zomeru/zoms.git
cd zoms
pnpm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Sanity CMS (Required)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_write_token

# AI Blog Generation (Optional)
GEMINI_API_KEY=your_gemini_api_key

# Rate Limiting (Optional - uses in-memory fallback)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Logging Configuration (Optional)
LOG_LEVEL=info                    # trace, debug, info, warn, error, fatal
NEXLOG_STRUCTURED=false          # true for JSON logs
```

3. **Start development servers:**

```bash
# Frontend (localhost:3000)
pnpm dev

# CMS Studio (localhost:3333) - separate terminal
pnpm studio:dev
```

## 📝 Content Management

### Dynamic Content (Sanity CMS)

Use Sanity Studio for managing experience and blog content:

1. **Access Studio**: Open [localhost:3333](http://localhost:3333)
2. **Sign In**: Use your Sanity account credentials
3. **Edit Content**: Create/modify experience entries and blog posts
4. **Auto-Update**: Changes appear on site within 60 seconds (ISR)

### Static Content (TypeScript Constants)

Edit files directly for static content:

- **Projects**: `src/constants/projects.ts`
- **Tech Stack**: `src/constants/other.ts`
- **Personal Info**: `src/constants/other.ts`
- **Blog Topics**: `src/constants/topics.ts` (for AI generation)

### AI Blog Generation

#### Via Web Interface:

1. Navigate to `/blog` on your site
2. Click "Generate Blog with AI"
3. AI automatically selects topic and generates content
4. Post publishes to Sanity with metadata

#### Via API:

```bash
curl -X POST http://localhost:3000/api/blog/generate \
  -H "Content-Type: application/json" \
  -d '{"aiGenerated": true}'
```

### Markdown Architecture

The blog system uses a modern, simplified markdown processing pipeline:

**Content Flow:**

1. **AI Generation**: Gemini generates markdown content with proper formatting
2. **Direct Storage**: Raw markdown is stored in Sanity's `bodyMarkdown` field
3. **Render Time**: React-markdown processes markdown during render with:
   - GitHub-flavored markdown (tables, task lists, strikethrough)
   - Syntax highlighting via React Syntax Highlighter
   - Custom styled components for headings, blockquotes, code blocks

**Benefits:**

- ⚡ **Faster API Response**: No server-side preprocessing required
- 🔧 **Simpler Code**: 400+ lines of custom parser removed
- 📝 **Better Markdown**: Full GFM support out of the box
- 🔄 **Backward Compatible**: Legacy block content still supported

**Unified.js Integration:**

- `markdownProcessor.ts` provides unified pipeline for future use
- Can process markdown to HTML with rehype plugins
- Currently rendering handled by react-markdown for better React integration

## 📦 Available Scripts

### Development

```bash
pnpm dev                 # Start Next.js development server
pnpm studio:dev          # Start Sanity Studio locally
```

### Quality Assurance

```bash
pnpm test-all           # Run format, lint, and type checks
pnpm test-all:build     # Full validation + production build
pnpm lint               # ESLint with auto-fix
pnpm format             # Prettier formatting
pnpm check-types        # TypeScript validation
pnpm check-format       # Check Prettier formatting
pnpm check-lint         # Check ESLint rules
```

### Production & Deployment

```bash
pnpm build              # Production build with validation
pnpm start              # Start production server
pnpm studio:deploy      # Deploy Sanity Studio
```

## 🏗️ Project Structure

```
zoms/
├── src/                    # Frontend application
│   ├── app/               # Next.js App Router
│   │   ├── blog/         # Blog pages and components
│   │   │   ├── page.tsx  # Blog listing with AI generation
│   │   │   ├── BlogListClient.tsx    # Client-side pagination
│   │   │   ├── BlogGenerateButton.tsx # AI generation UI
│   │   │   └── [slug]/   # Dynamic blog post pages
│   │   ├── api/          # API routes with validation
│   │   │   └── blog/     # Blog CRUD operations
│   │   │       ├── route.ts           # List posts with pagination
│   │   │       ├── generate/route.ts  # AI blog generation
│   │   │       └── [slug]/route.ts    # Single post operations
│   │   ├── layout.tsx    # Root layout with metadata
│   │   └── page.tsx      # Home page with all sections
│   ├── components/        # React components
│   │   ├── Sections/     # Main content sections
│   │   │   ├── Blog.tsx  # Latest blog posts preview
│   │   │   ├── Experience.tsx # Sanity-powered experience
│   │   │   └── ...       # Other sections
│   │   ├── Portal/       # Modal system
│   │   └── ...           # UI components
│   ├── lib/              # Utilities and services
│   │   ├── blog.ts       # Blog data fetching with ISR
│   │   ├── generateBlog.ts # AI blog generation logic
│   │   ├── generateBlogHelpers.ts # JSON parsing utilities
│   │   ├── markdownProcessor.ts # Unified.js markdown pipeline
│   │   ├── schemas.ts    # Zod validation schemas
│   │   ├── errorHandler.ts # Centralized error handling
│   │   ├── rateLimit.ts  # Rate limiting utilities
│   │   ├── logger.ts     # Structured logging system
│   │   └── ...           # Other utilities
│   ├── constants/         # Static content and configuration
│   ├── configs/          # App configuration (SEO, etc.)
│   └── styles/           # Global styles with TailwindCSS v4
│       └── globals.css   # Theme variables and custom utilities
├── studio/               # Sanity CMS workspace
│   ├── schemas/         # Content schemas
│   │   ├── blogPost.ts  # Blog post schema
│   │   ├── experience.ts # Experience schema
│   │   └── ...          # Other schemas
│   └── sanity.config.ts # Studio configuration
└── public/              # Static assets and sitemaps
```

## 🔧 Environment Configuration

### Required Variables

**Sanity CMS:**

- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Your Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` - Dataset name (usually `production`)
- `SANITY_API_TOKEN` - Write token for content operations

### Optional Variables

**AI Blog Generation:**

- `GEMINI_API_KEY` - Google Gemini API key for content generation

**Rate Limiting (Production Enhancement):**

- `UPSTASH_REDIS_REST_URL` - Redis URL for distributed rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication token

**Logging Configuration:**

- `LOG_LEVEL` - Log level (trace, debug, info, warn, error, fatal)
- `NEXLOG_STRUCTURED` - Enable JSON structured logging (true/false)

**Site Configuration:**

- `SITE_URL` - Custom site URL (auto-detected otherwise)

## 🚀 Deployment

### Automatic Deployment (Recommended)

1. **Push to Main**: Triggers automatic Vercel deployment
2. **Build Process**: Includes validation, type checking, and sitemap generation
3. **ISR Activation**: 60-second revalidation for dynamic content
4. **Studio Deployment**: Deploy separately via `pnpm studio:deploy`

### Manual Deployment

```bash
# Validate before deployment
pnpm test-all:build

# Deploy studio (if schema changes)
pnpm studio:deploy

# Deploy to Vercel
vercel deploy --prod
```

### Environment-Specific Configurations

- **Development**: Detailed logs, in-memory rate limiting, local studio
- **Production**: Structured logs, Redis rate limiting, deployed studio
- **ISR**: 60-second revalidation ensures fresh content without rebuilds

## 🎨 Customization

### Styling with TailwindCSS v4

The project uses TailwindCSS v4 with modern CSS features:

```css
/* src/styles/globals.css */
@theme {
  --color-backgroundPrimary: #0e0e0e;
  --color-backgroundSecondary: #1a1a1a;
  --color-primary: #ad5aff;
  --color-secondary: #ffb2de;
  --color-textPrimary: #f2f2f2;
  --color-textSecondary: #919191;
}

@utility section-title {
  color: var(--color-primary);
  font-weight: 500;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}
```

### Content Customization

- **Blog Topics**: Update `src/constants/topics.ts` for AI generation topics
- **SEO**: Modify `src/configs/seo.ts` for metadata and Open Graph
- **Social Links**: Edit redirects in `next.config.js`
- **Personal Info**: Update constants in `src/constants/other.ts`

### Sanity Schema Customization

- **Experience**: `studio/schemas/experience.ts`
- **Blog Posts**: `studio/schemas/blogPost.ts`
- **Rich Text**: `studio/schemas/blockContent.ts` and `blogPostBlockContent.ts`

## 📈 Performance & Monitoring

### Performance Features

- **ISR**: 60-second revalidation for dynamic content freshness
- **Static Generation**: Build-time optimization for static pages
- **Image Optimization**: Automatic Next.js image optimization
- **Bundle Analysis**: Integrated build size monitoring
- **Edge Runtime**: Compatible logging and error handling

### Monitoring & Analytics

- **Vercel Analytics**: User interaction and performance metrics
- **Speed Insights**: Real user performance monitoring
- **Structured Logging**: Comprehensive application logging with PII protection
- **Error Tracking**: Centralized error management with context

### Security Features

- **Rate Limiting**: API protection with Redis backend
- **Input Validation**: Zod schemas for all API inputs
- **Error Sanitization**: Environment-aware error responses
- **PII Protection**: Automatic sensitive data redaction in logs
- **Type Safety**: TypeScript prevents runtime errors

## 🔒 Security & Privacy

### Data Protection

- **GDPR Compliance**: Automatic PII sanitization in logs
- **Environment Variables**: Secure credential management
- **Input Sanitization**: Comprehensive validation of all inputs
- **Error Handling**: No sensitive data in error responses

### API Security

- **Rate Limiting**: Prevent abuse with configurable limits
- **Schema Validation**: Type-safe request/response validation
- **Error Boundaries**: Graceful error handling with context
- **Authentication**: Token-based access for sensitive operations

## 🤝 Contributing

1. **Fork** the repository
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Follow TypeScript and styling conventions
4. **Run Validation**: `pnpm test-all` must pass
5. **Commit Changes**: `git commit -m 'feat: add amazing feature'`
6. **Push to Branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**: Provide clear description of changes

### Development Guidelines

- **Type Safety**: All code must pass TypeScript strict mode
- **Code Quality**: Pre-commit hooks enforce formatting and linting
- **Testing**: Validate all features in development and production
- **Documentation**: Update relevant documentation for changes

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the powerful React framework
- [Sanity](https://sanity.io/) for the flexible headless CMS
- [TailwindCSS](https://tailwindcss.com/) for utility-first styling
- [Vercel](https://vercel.com/) for seamless deployment and analytics
- [Google Gemini](https://ai.google.dev/) for AI-powered content generation
- [Upstash](https://upstash.com/) for serverless Redis infrastructure

---

**Made with ☕ by [Zomer Gregorio](https://zoms.vercel.app)**

_Building the future, one line of code at a time._
