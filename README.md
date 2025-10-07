# Zoms - Portfolio & Blog

Modern, responsive portfolio website for Zomer Gregorio featuring dynamic content management and AI-powered blog generation.

🌐 **Live Site**: [zomeru.com](https://zoms.vercel.app)  
🎨 **Studio**:

## ✨ Features

- **🎨 Modern Design**: Dark theme with purple accents and smooth animations
- **📱 Fully Responsive**: Mobile-first design with elegant desktop layout
- **⚡ Performance Optimized**: Next.js 15 with ISR and Vercel Speed Insights
- **🤖 AI-Powered Blog**: Automatic weekly blog generation using Google Gemini AI
- **📝 Content Management**: Dynamic content via Sanity CMS with live preview
- **🎯 SEO Optimized**: Comprehensive metadata, Open Graph, and automatic sitemaps
- **💻 Syntax Highlighting**: Beautiful code blocks in blog posts
- **🔍 Type Safe**: Full TypeScript coverage with strict configuration
- **🔧 Developer Experience**: ESLint, Prettier, and Husky pre-commit hooks

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.9.3
- **Styling**: TailwindCSS v4.1.13
- **UI Components**: React 19.1.1
- **Analytics**: Vercel Analytics & Speed Insights

### Content & AI

- **CMS**: Sanity for dynamic content management
- **AI**: Google Gemini API for blog generation
- **Rich Text**: Portable Text with React Syntax Highlighter

### Development

- **Package Manager**: pnpm 10.17.1
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier with import sorting
- **Git Hooks**: Husky for pre-commit validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10.17.1+
- Sanity account (free tier available)

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
```

3. **Start development servers:**

```bash
# Frontend (localhost:3000)
pnpm dev

# CMS Studio (localhost:3333) - separate terminal
pnpm studio:dev
```

## 📝 Content Management

### Experience & Blog Content

Use Sanity Studio for managing dynamic content:

1. Open [localhost:3333](http://localhost:3333)
2. Sign in with your Sanity account
3. Create/edit experience entries and blog posts
4. Changes appear on the site within 60 seconds (ISR)

### Static Content

Edit TypeScript files for static content:

- **Projects**: `src/constants/projects.ts`
- **Tech Stack**: `src/constants/other.ts`
- **Personal Info**: `src/constants/other.ts`

### AI Blog Generation

1. Navigate to `/blog` on your site
2. Click "Generate New Post"
3. AI creates content based on rotating topics
4. Posts automatically publish to Sanity

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
```

### Production

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
│   │   ├── api/          # API routes (blog operations)
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/        # React components
│   │   ├── Sections/     # Main content sections
│   │   └── Portal/       # Modal system
│   ├── lib/              # Utilities and services
│   │   ├── blog.ts       # Blog data fetching
│   │   ├── sanity.ts     # Sanity client
│   │   └── generateBlog.ts # AI blog generation
│   ├── constants/         # Static content
│   ├── configs/          # App configuration
│   └── styles/           # Global styles
├── studio/               # Sanity CMS workspace
│   ├── schemas/         # Content schemas
│   └── sanity.config.ts # Studio configuration
└── public/              # Static assets and sitemaps
```

## 🔧 Environment Configuration

### Required Variables

**Sanity CMS:**

- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Your Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` - Dataset name (usually `production`)
- `SANITY_API_TOKEN` - Write token for content operations

**AI Blog Generation (Optional):**

- `GEMINI_API_KEY` - Google Gemini API key for content generation

### Optional Variables

- `SITE_URL` - Custom site URL (defaults based on environment)

## 🚀 Deployment

### Automatic Deployment (Recommended)

1. Push to main branch
2. Vercel automatically deploys with ISR
3. Sanity Studio deploys separately via `pnpm studio:deploy`

### Manual Deployment

```bash
# Validate before deployment
pnpm test-all:build

# Deploy studio
pnpm studio:deploy

# Deploy to Vercel (or your platform)
vercel deploy --prod
```

## 🎨 Customization

### Styling

- **Colors**: Modify `tailwind.config.js` for color scheme
- **Components**: Update individual component files
- **Global Styles**: Edit `src/styles/globals.css`

### Content

- **Blog Topics**: Update `src/constants/topics.ts` for AI generation
- **SEO**: Modify `src/configs/seo.ts` for metadata
- **Social Links**: Edit social redirects in `next.config.js`

### Sanity Schemas

- **Experience**: `studio/schemas/experience.ts`
- **Blog Posts**: `studio/schemas/blogPost.ts`
- **Rich Text**: `studio/schemas/blockContent.ts`

## 📈 Performance

- **ISR**: 60-second revalidation for dynamic content
- **Static Generation**: Build-time optimization for static pages
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Integrated build size monitoring

## 🔒 Security

- **Environment Variables**: Secure credential management
- **API Routes**: Server-side content operations
- **Type Safety**: TypeScript prevents runtime errors
- **Dependencies**: Regular security audits via Dependabot

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run validation: `pnpm test-all`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Sanity](https://sanity.io/) for the flexible CMS
- [TailwindCSS](https://tailwindcss.com/) for utility-first styling
- [Vercel](https://vercel.com/) for seamless deployment
- [Google Gemini](https://ai.google.dev/) for AI-powered content generation

---

**Made with ☕ by [Zomer Gregorio](https://zoms.vercel.app)**

_Building the future, one line of code at a time._
