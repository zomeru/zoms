# Codebase Structure

## Root Directory Structure
```
/
├── .github/              # GitHub configuration (dependabot)
├── .husky/              # Git hooks (pre-commit validation)
├── public/              # Static assets, manifests, sitemaps
├── src/                 # Source code
├── package.json         # Dependencies and scripts
├── next.config.js       # Next.js configuration with redirects
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.json       # ESLint configuration
└── .prettierrc          # Prettier configuration
```

## Source Code Organization (`src/`)
```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx       # Root layout with font, metadata, global styles
│   ├── page.tsx         # Home page component
│   └── not-found.tsx    # 404 page
├── components/          # Reusable UI components
│   ├── index.ts         # Barrel exports
│   ├── MainInfo.tsx     # Left sidebar with name, title, navigation
│   ├── MouseFollower.tsx # Interactive mouse follower effect
│   ├── DogeModal.tsx    # Modal component
│   ├── Footer.tsx       # Footer component
│   ├── Navigation.tsx   # Navigation menu
│   ├── Socials.tsx      # Social media links
│   ├── Portal/          # Portal component for modals
│   └── Sections/        # Main content sections
│       ├── index.ts     # Barrel exports
│       ├── About.tsx    # About section
│       ├── Experience.tsx # Work experience section
│       ├── Projects.tsx # Projects showcase section
│       └── TechStack.tsx # Technology stack section
├── configs/             # Application configuration
│   ├── index.ts         # Barrel exports
│   └── seo.ts           # SEO metadata and OpenGraph config
├── constants/           # Static data and content
│   ├── index.ts         # Barrel exports
│   ├── experience.ts    # Work experience data
│   ├── projects.ts      # Project portfolio data
│   └── other.ts         # Other miscellaneous constants
└── styles/              # Global styles
    └── globals.css      # Tailwind imports and custom CSS
```

## Key Architectural Patterns

### Layout Structure
- **Two-column layout**: Fixed left sidebar (`MainInfo`) + scrollable right content
- **Responsive design**: Stacks vertically on mobile, side-by-side on desktop
- **Fixed positioning**: Left sidebar stays in place while right content scrolls

### Component Hierarchy
```
RootLayout
├── MouseFollower (global interactive element)
└── Home Page
    ├── MainInfo (left sidebar)
    │   ├── Navigation
    │   └── Socials  
    └── Content Sections (right side)
        ├── About
        ├── TechStack
        ├── Experience
        ├── Projects
        ├── Footer
        └── DogeModal
```

### Data Flow
- **Static content**: Stored in `constants/` files as TypeScript objects
- **Configuration-driven**: SEO, colors, and app settings in `configs/`
- **Component props**: Data passed down from constants to display components

### Import Strategy
- **Barrel exports**: Clean imports via `index.ts` files
- **Path aliases**: `@/` prefix for all src/ imports
- **Default exports**: Components use default exports with named barrel re-exports