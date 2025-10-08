# Design System & Styling Guide

## TailwindCSS v4 Implementation

The project uses TailwindCSS v4 with a modern `@theme` directive approach in `src/styles/globals.css`. **No `tailwind.config.js` file is needed.**

### Color System Definition

```css
@theme {
  --color-backgroundPrimary: #0e0e0e;
  --color-backgroundSecondary: #1a1a1a;
  --color-primary: #ad5aff;
  --color-secondary: #ffb2de;
  --color-textPrimary: #f2f2f2;
  --color-textSecondary: #919191;
}
```

### Custom Utility Classes

TailwindCSS v4 allows defining custom utilities directly in CSS using `@utility`:

```css
@utility highlight {
  color: var(--color-textPrimary);
  font-weight: 500;
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;

  &:hover {
    color: var(--color-primary);
  }
}

@utility section-title {
  color: var(--color-primary);
  font-weight: 500;
  font-size: 1.25rem;
  line-height: 1.75rem;
  margin-bottom: 0.75rem;
}

@utility btn-primary {
  position: relative;
  color: var(--color-textPrimary);

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 2px;
    background-color: var(--color-primary);
    transform: translateY(0.25rem);
    opacity: 0;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
  }

  &:hover::before {
    opacity: 1;
  }
}

@utility link-primary {
  position: relative;
  color: var(--color-textPrimary);

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 2px;
    background-color: var(--color-primary);
    transform: translateY(0.25rem);
    opacity: 0;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
  }

  &:hover::before {
    opacity: 1;
  }

  &::after {
    content: '→';
    position: absolute;
    margin-left: 0.5rem;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }

  &:hover::after {
    transform: translateX(0.5rem);
  }
}
```

### Animation System

Custom animations defined with `@keyframes` and `@utility`:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@utility animate-fadeIn {
  animation: fadeIn 200ms ease-out;
}

@utility animate-modalSlideIn {
  animation: modalSlideIn 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Component Styling Patterns

### Using CSS Variables in Components

Components reference the CSS variables using standard Tailwind utility classes:

```tsx
// Primary text
<p className="text-textPrimary">Primary text</p>

// Secondary text
<p className="text-textSecondary">Secondary text</p>

// Primary background
<div className="bg-backgroundPrimary">Content</div>

// Secondary background
<div className="bg-backgroundSecondary">Content</div>

// Primary color (purple accent)
<span className="text-primary">Highlighted text</span>

// Secondary color (pink accent)
<span className="text-secondary">Secondary accent</span>
```

### Custom Utility Usage

```tsx
// Custom section title
<h2 className="section-title">Section Title</h2>

// Custom link with arrow animation
<Link href="/blog" className="link-primary">
  Go to blog page
</Link>

// Custom button styling
<button className="btn-primary">
  Click me
</button>

// Highlight text with hover effect
<span className="highlight">Highlighted text</span>
```

### Toast Notifications

React Hot Toast styled to match the design system:

```tsx
<Toaster
  position='top-center'
  toastOptions={{
    duration: 4000,
    style: {
      background: '#1a1a1a', // backgroundSecondary
      color: '#f2f2f2', // textPrimary
      border: '1px solid rgba(145, 145, 145, 0.2)'
    },
    success: {
      iconTheme: {
        primary: '#ad5aff', // primary
        secondary: '#f2f2f2' // textPrimary
      }
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#f2f2f2'
      }
    }
  }}
/>
```

## Layout Patterns

### Two-Column Layout

```tsx
<main className='max-w-[1300px] mx-auto h-auto lg:h-full relative px-6 sm:px-12 md:px-16 lg:px-20 py-[50px] md:py-[90px]'>
  {/* Fixed sidebar */}
  <div className='lg:w-[550px] lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:flex lg:flex-col lg:justify-center'>
    <MainInfo />
  </div>

  {/* Scrollable content */}
  <div className='w-full lg:w-1/2 ml-0 lg:ml-auto relative pb-20 sm:pb-0'>
    <ContentSections />
  </div>
</main>
```

### Responsive Grid System

```tsx
<div className='grid grid-cols-8'>
  <div className='col-span-8 sm:col-span-2 text-textSecondary text-sm mb-1 sm:mb-0'>
    Date column
  </div>
  <div className='ml-0 sm:ml-4 col-span-8 sm:col-span-6'>Content column</div>
</div>
```

### Interactive List Items

```tsx
<li className="group lg:group-hover/list:opacity-50 lg:hover:!opacity-100 transition-all duration-300 ease-in-out hover:after:bg-[#ad5aff0a] after:content-[''] relative after:absolute after:w-full after:h-full after:top-0 after:left-0 after:transform after:scale-105 after:rounded-lg after:transition-colors after:duration-300 after:ease-in-out after:drop-shadow-md hover:after:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] after:pointer-events-none">
  List item content
</li>
```

## Typography System

### Font Configuration

- **Primary Font**: Inter (loaded via Google Fonts in `layout.tsx`)
- **Font Weights**: 300, 400, 500, 600, 700 available
- **Font Display**: swap for performance

### Text Hierarchy

```tsx
// Section titles (custom utility)
<h2 className="section-title">Section Title</h2>

// Primary text
<p className="text-textPrimary">Main content</p>

// Secondary text
<p className="text-textSecondary">Supporting content</p>

// Small text
<span className="text-sm text-textSecondary">Small details</span>

// Medium weight
<h3 className="text-base font-medium">Subsection</h3>
```

## Responsive Breakpoints

Standard Tailwind breakpoints used:

- **sm**: 640px (small devices)
- **md**: 768px (medium devices)
- **lg**: 1024px (large devices - main two-column breakpoint)
- **xl**: 1280px (extra large devices)

Mobile-first approach with `lg:` prefix for desktop-specific styles.

## Button and Interactive Elements

### Custom Button Styles

```tsx
// Primary button with background
<button className="px-4 py-2 bg-secondary text-backgroundPrimary rounded-lg hover:bg-opacity-80 transition-all text-sm font-medium">
  Generate Blog with AI
</button>

// Primary link with custom styling
<Link href="/path" className="link-primary">
  Link Text
</Link>

// Highlight on hover
<span className="highlight">Hoverable text</span>
```

### Form Elements

```tsx
// Input styling (following the color scheme)
<input className='bg-backgroundSecondary border border-gray-600 text-textPrimary placeholder-textSecondary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent' />
```

## Modal and Overlay System

### Modal Animations

```tsx
// Modal with custom animations
<div className='animate-fadeIn'>
  <div className='animate-modalSlideIn'>Modal content</div>
</div>
```

### Portal Styling

Uses React Portal for modal rendering with consistent styling.

## Development Guidelines

### Adding New Custom Utilities

Add to `src/styles/globals.css`:

```css
@utility my-custom-utility {
  /* CSS properties */
  property: value;

  &:hover {
    /* Hover state */
  }
}
```

### Color Usage Guidelines

- Use `backgroundPrimary` for main backgrounds
- Use `backgroundSecondary` for card/elevated surfaces
- Use `textPrimary` for main content text
- Use `textSecondary` for supporting text
- Use `primary` for brand accent (purple)
- Use `secondary` for secondary accent (pink)

### Transition Standards

```css
transition-property: all;
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
transition-duration: 300ms;
```

## Performance Considerations

- **CSS Variables**: Enable dynamic theming while maintaining performance
- **Custom Utilities**: Reduce bundle size by avoiding duplicate utility classes
- **Hover Effects**: Use CSS transforms and opacity for smooth animations
- **Media Queries**: Mobile-first approach reduces CSS complexity
