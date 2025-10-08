import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getBlogPostBySlug } from '@/lib/blog';
import { ApiError, handleApiError, validateSchema } from '@/lib/errorHandler';
import log from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const slugParamsSchema = z.object({
  slug: z.string().min(1)
});

/**
 * GET /api/blog/[slug]
 * Returns a single blog post by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();
  const path = '/api/blog/[slug]';

  try {
    // Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'BLOG_API');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const resolvedParams = await params;
    const { slug } = validateSchema(slugParamsSchema, resolvedParams);

    log.request('GET', path, { slug });

    const post = await log.timeAsync(
      'Fetch blog post by slug',
      async () => await getBlogPostBySlug(slug),
      { slug }
    );

    if (!post) {
      throw new ApiError('Blog post not found', 404, 'NOT_FOUND');
    }

    const duration = Date.now() - startTime;
    log.response('GET', path, 200, {
      duration: `${duration}ms`,
      slug,
      postId: post._id,
      title: post.title
    });

    return NextResponse.json({ post });
  } catch (error) {
    return handleApiError(error, {
      method: 'GET',
      path,
      metadata: { duration: Date.now() - startTime }
    });
  }
}
