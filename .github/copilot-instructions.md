# Copilot Instructions for Zoms Portfolio

## Project Overview
This is a modern Next.js 14 portfolio website for Zomer Gregorio using TypeScript, TailwindCSS, and the App Router. The site features a dark theme with purple accents and a two-column responsive layout.

## Architecture & Key Patterns

### Layout Structure
- **Two-column design**: Fixed left sidebar (`MainInfo`) with scrollable right content sections
- **Responsive breakpoints**: Mobile stacks vertically, desktop side-by-side using `lg:` prefix
- **App Router**: Uses `src/app/` directory with `layout.tsx` and `page.tsx`

### Component Organization
```
src/components/
├── index.ts           # Barrel exports for clean imports
├── MainInfo.tsx       # Left sidebar (name, title, navigation, socials)
├── Sections/          # Right-side content sections
│   ├── About.tsx
│   ├── TechStack.tsx
│   ├── Experience.tsx
│   └── Projects.tsx
```

### Data Management
- **Constants-driven content**: All portfolio data in `src/constants/` (experience.ts, projects.ts, other.ts)
- **Configuration-based SEO**: Comprehensive metadata in `src/configs/seo.ts`
- **Path aliases**: Use `@/` for all src/ imports (configured in tsconfig.json)

## Development Workflow

### Essential Commands
```bash
pnpm dev                 # Development server
npm run test-all         # Format + lint + type check
npm run test-all:build   # Full validation + build test
```

### Pre-commit Automation (Husky)
- **Automatic**: ESLint auto-fix + Prettier formatting on staged files
- **Type checking**: TypeScript validation before commit
- **Commit blocked** if any checks fail

## Code Style & Conventions

### TypeScript Patterns
- **Component types**: Always use `React.JSX.Element` return type
- **Strict config**: No implicit returns, unreachable code, or fallthrough cases
- **Props destructuring**: In function parameters with explicit typing

### Styling with TailwindCSS
- **Custom colors**: Use semantic names (`backgroundPrimary`, `textSecondary`, `primary`)
- **Responsive utilities**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Layout patterns**: `max-w-[1300px] mx-auto` for containers, `lg:w-[550px]` for sidebar

### Import/Export Conventions
- **Barrel exports**: Components exported via `index.ts` files
- **Default exports**: Components use default, utilities use named exports
- **Import order**: External packages, then internal with `@/` alias

## Key Integration Points

### SEO & Metadata
- **Environment-based URLs**: Production vs development domains in `src/configs/seo.ts`
- **Comprehensive metadata**: OpenGraph, Twitter cards, manifest, icons
- **Sitemap generation**: Automatic via `next-sitemap` after build

### Social Media Redirects
- **Next.js redirects**: Configured in `next.config.js` for `/github`, `/linkedin`, etc.
- **Permanent redirects**: All social links use `permanent: true`

### Content Updates
- **Experience**: Modify `src/constants/experience.ts`
- **Projects**: Update `src/constants/projects.ts` 
- **Personal info**: Edit `src/constants/other.ts`

## Common Tasks

### Adding New Components
1. Create in appropriate directory (`components/` or `components/Sections/`)
2. Use PascalCase naming with TypeScript
3. Add to barrel export in `index.ts`
4. Import using `@/components` alias

### Modifying Layout
- **Sidebar content**: Edit `MainInfo.tsx` and child components
- **Content sections**: Add/modify in `src/components/Sections/`
- **Responsive behavior**: Use Tailwind's `lg:` prefix for desktop-specific styles

### Deployment Preparation
- **Build validation**: `npm run test-all:build` must pass
- **Environment variables**: Ensure `SITE_URL` is set for production
- **Sitemap verification**: Check generated files in `public/` after build