# Design System and Styling

## Tailwind CSS Configuration

### Custom Color Palette

```js
colors: {
  backgroundPrimary: '#0e0e0e',    // Main dark background
  backgroundSecondary: '#1a1a1a',  // Secondary dark background
  primary: '#ad5aff',              // Purple brand color
  secondary: '#ffb2de',            // Pink accent color
  textPrimary: '#f2f2f2',          // Main text color (light)
  textSecondary: '#919191'         // Secondary text color (gray)
}
```

### Typography

- **Font**: Inter (Google Fonts) applied globally
- **Headers**: `text-4xl md:text-5xl` for h1, `text-xl md:text-2xl` for h2
- **Body**: Default text sizing with responsive adjustments
- **Weight**: `font-bold` for headers, `font-medium` for subheaders

### Layout Patterns

- **Container**: `max-w-[1300px] mx-auto` for main content width
- **Responsive spacing**: `px-6 sm:px-12 md:px-16 lg:px-20` for horizontal padding
- **Vertical spacing**: `py-[50px] md:py-[90px]` for section padding
- **Fixed sidebar**: `lg:w-[550px] mr-auto w-full static lg:fixed` for MainInfo

### Responsive Breakpoints

- **Mobile**: Base styles (default)
- **Small**: `sm:` (640px+)
- **Medium**: `md:` (768px+)
- **Large**: `lg:` (1024px+)

### Component-Specific Patterns

#### Two-Column Layout

```tsx
// Left sidebar (fixed on desktop)
className = 'lg:w-[550px] mr-auto w-full static lg:fixed';

// Right content area
className = 'w-full lg:w-1/2 ml-0 lg:ml-auto';
```

#### Interactive Elements

- **Hover states**: Subtle color transitions
- **Focus states**: Accessibility-compliant focus rings
- **Active states**: Visual feedback for clickable elements

#### Spacing System

- **Sections**: `space-y-3` for close elements, `pb-20 sm:pb-0` for section breaks
- **Transform effects**: `transform translate-y-20` for layout adjustments
- **Height constraints**: `h-auto lg:h-[calc(100vh-180px)]` for viewport fitting

### Animation and Effects

- **Mouse follower**: Custom component for interactive cursor effect
- **Smooth transitions**: CSS transitions for hover and focus states
- **Transform utilities**: Tailwind transforms for positioning adjustments

### Accessibility Considerations

- **Semantic HTML**: Proper heading hierarchy (h1, h2, h3)
- **Focus management**: Keyboard navigation support
- **Color contrast**: Dark theme with sufficient contrast ratios
- **Responsive text**: Scalable typography across devices
