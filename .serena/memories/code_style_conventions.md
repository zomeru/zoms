# Code Style Conventions

## TypeScript Configuration

### Strict Type Checking

```typescript
// tsconfig.json key settings
{
  "strict": true,
  "noImplicitReturns": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

### Component Typing Patterns

```typescript
// Always specify return type for components
const ComponentName = (): React.JSX.Element => {
  return <div>Content</div>;
};

// Props interface with proper typing
interface ComponentProps {
  title: string;
  optional?: boolean;
  children?: React.ReactNode;
}

const Component = ({ title, optional = false, children }: ComponentProps): React.JSX.Element => {
  return <div>{title}</div>;
};
```

## Component Conventions

### File Naming

- **Components**: PascalCase (e.g., `MainInfo.tsx`, `BlogContent.tsx`)
- **Utilities**: camelCase (e.g., `generateBlog.ts`, `utils.ts`)
- **Constants**: camelCase (e.g., `projects.ts`, `other.ts`)
- **API Routes**: lowercase (e.g., `route.ts`)

### Component Structure

```typescript
// 1. External imports
import React from 'react';
import Link from 'next/link';

// 2. Internal imports (using @/ alias)
import { ComponentName } from '@/components';
import { CONSTANT_NAME } from '@/constants';
import { functionName } from '@/lib/utils';

// 3. Type definitions
interface Props {
  // Props definition
}

// 4. Component implementation
const ComponentName = ({ prop }: Props): React.JSX.Element => {
  // Component logic
  return (
    <div>
      {/* JSX content */}
    </div>
  );
};

// 5. Default export
export default ComponentName;
```

### Barrel Exports

```typescript
// Usage
import { Footer, MainInfo, Navigation } from '@/components';

// components/index.ts
export { default as MainInfo } from './MainInfo';
export { default as Navigation } from './Navigation';
export { default as Footer } from './Footer';
```

## Data Fetching Patterns

### Sanity Data Fetching

```typescript
// ISR pattern with error handling
export async function getBlogPosts(limit = 25, offset = 0): Promise<BlogPostListItem[]> {
  try {
    const posts = await client.fetch<BlogPostListItem[]>(
      `*[_type == "blogPost"] | order(publishedAt desc) [$offset...$end] {
        _id,
        title,
        slug,
        summary,
        publishedAt,
        tags,
        generated,
        readTime
      }`,
      { offset, end: offset + limit },
      {
        // ISR revalidation
        next: { revalidate: 60 }
      }
    );

    return posts;
  } catch (error) {
    // Development-only logging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching blog posts from Sanity:', error);
    }
    return [];
  }
}
```

### API Route Patterns

```typescript
// Next.js 15 App Router API pattern
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // API logic
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    // Process request
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
```

## Styling Conventions

### TailwindCSS Class Organization

```typescript
// Group related classes with line breaks for readability
const Component = (): React.JSX.Element => {
  return (
    <div className='
      max-w-[1300px] mx-auto h-auto lg:h-full relative
      px-6 sm:px-12 md:px-16 lg:px-20
      py-[50px] md:py-[90px]
    '>
      <section className='
        mb-24 sm:mb-32
        group lg:group-hover/list:opacity-50 lg:hover:!opacity-100
        transition-all duration-300 ease-in-out
      '>
        Content
      </section>
    </div>
  );
};
```

### Responsive Design Patterns

```typescript
// Mobile-first approach
<div className='
  grid grid-cols-8
  space-y-6 mb-10
'>
  <div className='col-span-8 sm:col-span-2 text-textSecondary text-sm mb-1 sm:mb-0'>
    Date
  </div>
  <div className='ml-0 sm:ml-4 col-span-8 sm:col-span-6'>
    Content
  </div>
</div>
```

## Error Handling

### Component Error Boundaries

```typescript
// Graceful error handling with fallbacks
const Component = (): React.JSX.Element => {
  const [data, setData] = useState<DataType[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch((err) => {
        setError(err.message);
        // Use fallback data from constants
        setData(FALLBACK_DATA);
      });
  }, []);

  if (error && !data) {
    return <div>Unable to load content. Please try again later.</div>;
  }

  return <div>{/* Render data */}</div>;
};
```

### API Error Handling

```typescript
// Consistent error response format
export async function handleApiError(error: unknown): Promise<NextResponse> {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  // Log server errors but don't expose details
  console.error('API Error:', error);
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

## Import/Export Standards

### Path Aliases

```typescript
// Always use @/ alias for internal imports
import { Component } from '@/components';
import { config } from '@/configs';
import { CONSTANT } from '@/constants';
import { utility } from '@/lib/utils';

// Never use relative imports for src/ files
// ❌ import { Component } from '../../../components/Component';
// ✅ import { Component } from '@/components';
```

### Export Patterns

```typescript
// Default exports for components
export default ComponentName;

// Named exports for utilities and constants
export const CONSTANT_VALUE = 'value';
export const utilityFunction = () => {};

// Barrel exports for clean imports
// index.ts
export { default as ComponentA } from './ComponentA';
export { default as ComponentB } from './ComponentB';
export * from './constants';
```

## Environment and Configuration

### Environment Variable Patterns

```typescript
// Client-side variables (NEXT_PUBLIC_ prefix)
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

// Server-side only variables
const apiKey = process.env.GEMINI_API_KEY;

// Type-safe environment validation
if (!projectId) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is required');
}
```

### Configuration Management

```typescript
// Centralized configuration in configs/
export const seoConfig = {
  siteName: 'Zoms Portfolio',
  siteDescription: 'Software Engineer Portfolio',
  siteUrl: process.env.SITE_URL || 'https://zoms.vercel.app',
  openGraph: {
    type: 'website',
    locale: 'en_US'
    // ... other config
  }
};
```

## Performance Considerations

### Component Optimization

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Lazy loading for non-critical components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Dynamic imports for large dependencies
const generateBlog = async () => {
  const { generateWithGemini } = await import('@/lib/generateBlog');
  return generateWithGemini();
};
```

### Data Fetching Optimization

```typescript
// ISR with appropriate revalidation times
export const revalidate = 60; // 60 seconds for blog content
export const revalidate = 3600; // 1 hour for less frequent updates

// Parallel data fetching
const [posts, experience] = await Promise.all([getBlogPosts(), getExperience()]);
```

## Testing and Validation

### Type Safety

```typescript
// Comprehensive type definitions
interface BlogPost {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  summary: string;
  publishedAt: string;
  modifiedAt?: string;
  body: PortableTextBlock[];
  tags?: string[];
  source?: string;
  generated?: boolean;
  readTime?: number;
}

// Runtime validation for external data
const validateBlogPost = (data: unknown): data is BlogPost => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as BlogPost)._id === 'string' &&
    typeof (data as BlogPost).title === 'string'
    // ... other validations
  );
};
```

### Code Quality Tools

```typescript
// ESLint configuration adherence
/* eslint-disable no-console -- Allow console in development for debugging */
if (process.env.NODE_ENV === 'development') {
  console.error('Development error:', error);
}
/* eslint-enable no-console */

// Prettier formatting (auto-applied via Husky)
// No manual formatting required - handled by pre-commit hooks
```
