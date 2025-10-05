import { NextResponse, type NextRequest } from 'next/server';

import { getBlogPostCount, getBlogPosts } from '@/lib/blog';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blog
 * Returns paginated list of blog posts
 * Query parameters:
 *  - limit: number of posts to return (default: 25, max: 100)
 *  - offset: number of posts to skip (default: 0)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0);

    const [posts, total] = await Promise.all([getBlogPosts(limit, offset), getBlogPostCount()]);

    return NextResponse.json({
      posts,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console -- Allow console for API errors
    console.error('Error in /api/blog:', error);

    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}
