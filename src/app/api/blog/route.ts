import { NextResponse, type NextRequest } from 'next/server';

import { BLOG_POSTS_PAGE_SIZE } from '@/constants';
import { getBlogPostCount, getBlogPosts } from '@/lib/blog';
import { handleApiError, validateSchema } from '@/lib/errorHandler';
import log from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { blogListQuerySchema, blogListResponseSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blog
 * Returns paginated list of blog posts
 * Query parameters:
 *  - limit: number of posts to return (default: 25, max: 100)
 *  - offset: number of posts to skip (default: 0)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const path = '/api/blog';

  try {
    // Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'BLOG_API');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    log.request('GET', path);

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = validateSchema(blogListQuerySchema, {
      limit: searchParams.get('limit') ?? BLOG_POSTS_PAGE_SIZE,
      offset: searchParams.get('offset') ?? '0'
    });

    const { limit, offset } = queryParams;

    // Fetch data
    const [posts, total] = await log.timeAsync(
      'Fetch blog posts',
      async () => await Promise.all([getBlogPosts(limit, offset), getBlogPostCount()]),
      { limit, offset }
    );

    // Validate response
    const response = validateSchema(blogListResponseSchema, {
      posts,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    });

    const duration = Date.now() - startTime;
    log.response('GET', path, 200, {
      duration: `${duration}ms`,
      postCount: posts.length,
      total,
      hasMore: response.pagination.hasMore
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, {
      method: 'GET',
      path,
      metadata: { duration: Date.now() - startTime }
    });
  }
}
