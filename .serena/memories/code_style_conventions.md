# Code Style Conventions

## TypeScript Standards

### Component Types and Patterns

```typescript
// Always use React.JSX.Element return type for components
const MyComponent = async (): Promise<React.JSX.Element> => {
  return <div>Content</div>;
};

// Props destructuring in function parameters with explicit typing
interface ComponentProps {
  title: string;
  count?: number;
}

const Component = ({ title, count = 0 }: ComponentProps): React.JSX.Element => {
  return <div>{title}: {count}</div>;
};

// Async components (common in App Router)
const DataComponent = async (): Promise<React.JSX.Element> => {
  const data = await fetchData();
  return <div>{data}</div>;
};
```

### API Route Patterns

```typescript
// Standard API route structure with validation
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { handleApiError, validateSchema } from '@/lib/errorHandler';
import log from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const requestSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(10)
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting check
    const rateLimitResult = await rateLimitMiddleware(request, 'BLOG_API');
    if (rateLimitResult) return rateLimitResult;

    // Request validation
    const body = await request.json();
    const validatedData = validateSchema(requestSchema, body);

    // Business logic with logging
    log.info('Processing request', {
      method: 'POST',
      path: '/api/example'
    });

    const result = await processData(validatedData);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, {
      method: 'POST',
      path: '/api/example'
    });
  }
}
```

### Error Handling Patterns

```typescript
// Custom API errors
import { ApiError } from '@/lib/errorHandler';
// Client-side error handling
import { getClientErrorMessage } from '@/lib/errorMessages';

// Throw structured errors
throw new ApiError('Resource not found', 404, 'RESOURCE_NOT_FOUND', { resourceId: id });

try {
  await apiCall();
} catch (error) {
  const message = getClientErrorMessage(error);
  toast.error(message);
}
```

### Zod Schema Patterns

```typescript
// API validation schemas
export const blogPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false)
});

// Type inference from schemas
export type BlogPostInput = z.infer<typeof blogPostSchema>;

// Schema composition
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0)
});

export const blogListQuerySchema = z
  .object({
    search: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
  .merge(paginationSchema);
```

### Interface Definitions

```typescript
// Sanity document interfaces
export interface BlogPost {
  _id: string;
  _type: 'blogPost';
  title: string;
  slug: {
    _type: 'slug';
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

// Component prop interfaces
interface BlogListProps {
  posts: BlogPost[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}
```

## Styling Conventions

### TailwindCSS v4 Usage

```tsx
// Use semantic color names from CSS variables
<div className="bg-backgroundPrimary text-textPrimary">
  <h1 className="text-primary">Title</h1>
  <p className="text-textSecondary">Description</p>
</div>

// Custom utility classes for consistent patterns
<h2 className="section-title">Section Title</h2>
<Link href="/blog" className="link-primary">Blog Link</Link>
<button className="btn-primary">Primary Button</button>

// Responsive design with mobile-first approach
<div className="grid grid-cols-8">
  <div className="col-span-8 sm:col-span-2 text-textSecondary">
    Date
  </div>
  <div className="col-span-8 sm:col-span-6 ml-0 sm:ml-4">
    Content
  </div>
</div>

// Interactive hover effects
<li className="group lg:group-hover/list:opacity-50 lg:hover:!opacity-100 transition-all duration-300">
  Content
</li>
```

### Component Styling Patterns

```tsx
// Consistent spacing patterns
<section className="mb-24 sm:mb-32">
  <h2 className="section-title">Title</h2>
  <div className="space-y-6 mb-10">
    Content items
  </div>
</section>

// Layout container patterns
<main className="max-w-[1300px] mx-auto px-6 sm:px-12 md:px-16 lg:px-20 py-[50px] md:py-[90px]">
  Content
</main>

// Button styling conventions
<button className="px-4 py-2 bg-secondary text-backgroundPrimary rounded-lg hover:bg-opacity-80 transition-all text-sm font-medium">
  Action Button
</button>
```

## Import/Export Conventions

### Barrel Exports

```typescript
// Usage in files
import { About, Blog, Experience } from '@/components/Sections';
import { Footer, MainInfo } from '@/components';

// components/index.ts
export { default as MainInfo } from './MainInfo';
export { default as Footer } from './Footer';
export { default as DogeModal } from './DogeModal';

// components/Sections/index.ts
export { default as About } from './About';
export { default as Blog } from './Blog';
export { default as Experience } from './Experience';
```

### Default vs Named Exports

```typescript
// Components: Default exports
const BlogPost = (): React.JSX.Element => {
  return <article>Content</article>;
};

export default BlogPost;

// Utilities: Named exports
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};

export const generateSlug = (title: string): string => {
  return title.toLowerCase().replace(/\s+/g, '-');
};

// Types: Named exports
export interface BlogPost {
  id: string;
  title: string;
}

export type BlogStatus = 'draft' | 'published' | 'archived';
```

### Path Aliases Usage

```typescript
// Always use @/ for src/ imports

// External packages first, then internal
import React from 'react';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSEOConfig } from '@/configs/seo';
import { PROJECTS } from '@/constants/projects';
import { MainInfo } from '@/components';
import { handleError } from '@/lib/errorHandler';
import log from '@/lib/logger';
import { BlogPost } from '@/lib/types';
```

## Data Fetching Patterns

### ISR with Error Handling

```typescript
// Fetch with ISR and fallback
export async function getBlogPosts(limit = 25, offset = 0): Promise<BlogPost[]> {
  try {
    const posts = await client.fetch<BlogPost[]>(
      query,
      { limit, offset },
      {
        next: { revalidate: 60 } // ISR with 60-second revalidation
      }
    );
    return posts;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching from Sanity:', error);
    }
    // Return fallback data or empty array
    return [];
  }
}

// Server component data fetching
const BlogSection = async (): Promise<React.JSX.Element> => {
  const posts = await getLatestBlogPosts(MAX_PORTFOLIO_BLOG_POSTS);

  if (posts.length === 0) {
    return <p className="text-textSecondary">No posts available</p>;
  }

  return (
    <section>
      {posts.map(post => (
        <BlogCard key={post._id} post={post} />
      ))}
    </section>
  );
};
```

### Client-Side Data Fetching

```typescript
// Client component with error handling
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ClientComponent = (): React.JSX.Element => {
  const [data, setData] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await fetch('/api/blog');
        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        const result = await response.json();
        setData(result.posts);
      } catch (error) {
        toast.error('Failed to load data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return <div>{/* Render data */}</div>;
};
```

## Logging and Monitoring

### Structured Logging

```typescript
import log from '@/lib/logger';

// Standard logging with metadata
log.info('User action completed', {
  userId: user.id,
  action: 'blog_generated',
  duration: performance.now() - start
});

// Error logging with context
log.error('API request failed', {
  method: 'POST',
  path: '/api/blog/generate',
  error: error.message,
  userId: user?.id
});

// Performance monitoring
const result = await log.timeAsync('Blog generation', () => generateBlogPost(topic), {
  topic,
  model: 'gemini-pro'
});
```

### Error Boundary Patterns

```typescript
// Use Next.js error boundaries
// error.tsx in app directory
'use client';

import { useEffect } from 'react';
import log from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    log.error('Page error boundary triggered', {
      error: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <div className="text-center py-20">
      <h2 className="text-xl text-primary mb-4">Something went wrong!</h2>
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
```

## Security and Validation

### Environment Variable Handling

```typescript
// Validate required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  SANITY_API_TOKEN: process.env.SANITY_API_TOKEN
} as const;

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Optional environment variables with defaults
const config = {
  logLevel: process.env.LOG_LEVEL ?? 'info',
  rateLimit: {
    maxRequests: Number(process.env.RATE_LIMIT_MAX) || 60,
    windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 60000
  }
};
```

### Input Sanitization

```typescript
// Sanitize user inputs
import { sanitizeValue } from '@/lib/logger';

const sanitizedInput = sanitizeValue(userInput);
log.info('User input received', { input: sanitizedInput });

// Validate file uploads
const validateImageUpload = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  return allowedTypes.includes(file.type) && file.size <= maxSize;
};
```

## Testing Patterns

### Component Testing Conventions

```typescript
// Test component render and behavior
import { render, screen } from '@testing-library/react';
import BlogCard from '@/components/BlogCard';

test('renders blog card with title and summary', () => {
  const mockPost = {
    _id: '1',
    title: 'Test Post',
    summary: 'Test summary',
    slug: { current: 'test-post' },
    publishedAt: '2024-01-01'
  };

  render(<BlogCard post={mockPost} />);

  expect(screen.getByText('Test Post')).toBeInTheDocument();
  expect(screen.getByText('Test summary')).toBeInTheDocument();
});
```

### API Testing Patterns

```typescript
// Test API endpoints
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/blog/route';

test('GET /api/blog returns blog posts', async () => {
  const request = new NextRequest('http://localhost/api/blog');
  const response = await GET(request);

  expect(response.status).toBe(200);

  const data = await response.json();
  expect(data).toHaveProperty('posts');
  expect(Array.isArray(data.posts)).toBe(true);
});
```
