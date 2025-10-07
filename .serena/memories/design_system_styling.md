# Design System & Styling Guide

## Color Scheme

### Primary Brand Colors

```css
--color-primary: #ad5aff; /* Purple accent for links and highlights */
--color-primary-hover: #9d4aef; /* Darker purple for hover states */
```

### Background Colors

```css
--color-background-primary: #0d1117; /* Main dark background */
--color-background-secondary: #161b22; /* Secondary background for cards */
--color-background-tertiary: #21262d; /* Tertiary background for highlights */
```

### Text Colors

```css
--color-text-primary: #f0f6fc; /* Primary text (white-ish) */
--color-text-secondary: #9198a1; /* Secondary text (gray) */
--color-text-tertiary: #656d76; /* Tertiary text (darker gray) */
```

### Interactive States

```css
--color-hover-bg: #ad5aff0a; /* Subtle purple background on hover */
--color-border: #30363d; /* Border color for elements */
```

## Typography System

### Font Configuration

- **Primary Font**: Inter (Google Fonts)
- **Font Weights**: 300, 400, 500, 600, 700
- **Font Display**: swap (for performance)

### Text Hierarchy

```css
.section-title {
  @apply text-xl font-medium text-textPrimary mb-6;
}

.link-primary {
  @apply text-primary hover:text-primaryHover underline transition-colors;
}

.text-gradient {
  @apply bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent;
}
```

## Layout System

### Container Patterns

```css
.main-container {
  @apply max-w-[1300px] mx-auto h-auto lg:h-full relative;
  @apply px-6 sm:px-12 md:px-16 lg:px-20 py-[50px] md:py-[90px];
}

.sidebar-fixed {
  @apply lg:w-[550px] lg:fixed lg:top-0 lg:left-0 lg:h-screen;
  @apply lg:flex lg:flex-col lg:justify-center;
}

.content-scrollable {
  @apply w-full lg:w-1/2 ml-0 lg:ml-auto relative pb-20 sm:pb-0;
}
```

### Responsive Breakpoints

- **sm**: 640px (small devices)
- **md**: 768px (medium devices)
- **lg**: 1024px (large devices - main breakpoint for two-column layout)
- **xl**: 1280px (extra large devices)

## Component Styling Patterns

### Interactive Elements

```css
.hover-lift {
  @apply transition-all duration-300 ease-in-out;
  @apply lg:group-hover/list:opacity-50 lg:hover:!opacity-100;
  @apply hover:after:bg-[#ad5aff0a];
}

.card-hover {
  @apply relative after:absolute after:w-full after:h-full after:top-0 after:left-0;
  @apply after:transform after:scale-105 after:rounded-lg;
  @apply after:transition-colors after:duration-300 after:ease-in-out;
  @apply hover:after:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)];
  @apply after:pointer-events-none;
}
```

### Navigation Styling

```css
.nav-link {
  @apply block py-2 text-textSecondary hover:text-primary;
  @apply transition-colors duration-200 font-medium;
}

.nav-link--active {
  @apply text-primary;
}
```

### Blog Content Styling

```css
.prose-custom {
  @apply prose prose-invert max-w-none;
  @apply prose-headings:text-textPrimary prose-p:text-textSecondary;
  @apply prose-a:text-primary prose-a:no-underline hover:prose-a:underline;
  @apply prose-code:text-primary prose-code:bg-backgroundSecondary;
  @apply prose-pre:bg-backgroundSecondary prose-pre:border prose-pre:border-border;
}
```

## Animation and Transitions

### Standard Transitions

```css
.transition-standard {
  @apply transition-all duration-300 ease-in-out;
}

.transition-fast {
  @apply transition-all duration-200 ease-in-out;
}

.transition-slow {
  @apply transition-all duration-500 ease-in-out;
}
```

### Hover Effects

```css
.text-hover {
  @apply transition-colors duration-200;
}

.scale-hover {
  @apply transition-transform duration-300 hover:scale-105;
}

.opacity-hover {
  @apply transition-opacity duration-300;
}
```

## Modal and Overlay Styling

### Modal Base

```css
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-backgroundPrimary border border-border rounded-lg;
  @apply max-w-md w-full p-6 shadow-xl;
}
```

### Portal Styling

```css
.portal-container {
  @apply fixed inset-0 z-50 flex items-center justify-center;
  @apply bg-black bg-opacity-50 backdrop-blur-sm;
}
```

## Form and Input Styling

### Button Patterns

```css
.btn-primary {
  @apply bg-primary hover:bg-primaryHover text-white;
  @apply px-4 py-2 rounded-md font-medium;
  @apply transition-colors duration-200;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-backgroundSecondary hover:bg-backgroundTertiary;
  @apply text-textPrimary border border-border;
  @apply px-4 py-2 rounded-md font-medium;
  @apply transition-colors duration-200;
}
```

### Input Styling

```css
.input-base {
  @apply bg-backgroundSecondary border border-border;
  @apply text-textPrimary placeholder-textTertiary;
  @apply px-3 py-2 rounded-md focus:outline-none;
  @apply focus:ring-2 focus:ring-primary focus:border-transparent;
}
```

## Spacing System

### Section Spacing

```css
.section-spacing {
  @apply mb-24 sm:mb-32;
}

.element-spacing {
  @apply mb-6;
}

.tight-spacing {
  @apply mb-4;
}
```

### Grid Layouts

```css
.grid-responsive {
  @apply grid grid-cols-8;
}

.grid-date {
  @apply col-span-8 sm:col-span-2;
}

.grid-content {
  @apply ml-0 sm:ml-4 col-span-8 sm:col-span-6;
}
```

## Custom Utilities

### TailwindCSS v4 Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#ad5aff',
        primaryHover: '#9d4aef',
        backgroundPrimary: '#0d1117',
        backgroundSecondary: '#161b22',
        backgroundTertiary: '#21262d',
        textPrimary: '#f0f6fc',
        textSecondary: '#9198a1',
        textTertiary: '#656d76',
        border: '#30363d'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  }
};
```

### Dark Theme Considerations

- **Default theme**: Dark mode is the primary theme
- **Contrast ratios**: WCAG AA compliant color combinations
- **Visual hierarchy**: Proper contrast between primary, secondary, and tertiary text
- **Interactive feedback**: Clear hover and focus states for accessibility

## Component-Specific Styling

### MainInfo Sidebar

```css
.sidebar-content {
  @apply flex flex-col lg:justify-center lg:h-screen;
  @apply lg:sticky lg:top-0 lg:w-[550px];
}
```

### Project Cards

```css
.project-card {
  @apply group relative p-6 rounded-lg;
  @apply hover:bg-backgroundSecondary transition-colors;
  @apply border border-transparent hover:border-border;
}
```

### Experience Timeline

```css
.experience-item {
  @apply relative pl-6 border-l border-border;
  @apply last:border-l-transparent;
}

.experience-date {
  @apply text-textTertiary text-sm font-mono;
}
```

### Blog Post Styling

```css
.blog-post-card {
  @apply group transition-all duration-300;
  @apply hover:bg-backgroundSecondary rounded-lg p-4;
}

.blog-meta {
  @apply text-textTertiary text-sm;
}

.blog-summary {
  @apply text-textSecondary mt-2 line-clamp-3;
}
```
