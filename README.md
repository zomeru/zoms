# New Portfolio

My latest portfolio at https://zoms.vercel.app/

## Tech Used

- TypeScript
- NextJS
- TailwindCSS
- Sanity CMS

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10.17.1 (specified in `package.json`)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env.local` file with your Sanity credentials (see `.env.example`):

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
```

4. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portfolio.

## 📝 Content Management

This portfolio uses [Sanity CMS](https://www.sanity.io/) for managing the Experience section dynamically.

### Managing Experience Content

To update your work experience without modifying code:

1. Start Sanity Studio:

```bash
pnpm studio:dev
```

2. Open [http://localhost:3333](http://localhost:3333) in your browser
3. Sign in with your Sanity account
4. Add, edit, or remove experience entries through the UI

For detailed instructions, see [SANITY_SETUP.md](./SANITY_SETUP.md)

## 📦 Available Scripts

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm format` - Format code with Prettier
- `pnpm check-types` - Run TypeScript type checking
- `pnpm test-all` - Run all checks (format, lint, types)
- `pnpm test-all:build` - Run all checks and build
- `pnpm studio:dev` - Start Sanity Studio locally
- `pnpm studio:build` - Build Sanity Studio
- `pnpm studio:deploy` - Deploy Sanity Studio

## 🏗️ Project Structure

```
.
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── configs/       # Configuration files (SEO, etc.)
│   ├── constants/     # Static data and fallback content
│   ├── lib/           # Utility functions and services
│   └── styles/        # Global styles
├── studio/            # Sanity Studio configuration
│   ├── schemas/       # Sanity schema definitions
│   └── sanity.config.ts
└── public/            # Static assets
```

## 🔧 Environment Variables

Required environment variables for Sanity CMS:

- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Your Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` - Dataset name (usually `production`)

See `.env.example` for reference.

## 🎨 Features

- **Dynamic Content Management** - Update experience section via Sanity Studio
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Modern Stack** - Next.js 15, React 19, TypeScript
- **SEO Optimized** - Comprehensive metadata and sitemap
- **Type Safe** - Full TypeScript coverage
- **Code Quality** - ESLint, Prettier, and Husky pre-commit hooks
- **ISR Support** - Incremental Static Regeneration with 60s revalidation

---

Made with ☕ by [**Zomer Gregorio**](https://zoms.vercel.app/)
