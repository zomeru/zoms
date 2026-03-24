import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient, type SanityClient } from '@sanity/client';
import { z } from 'zod';

import { getBlogPostBySlug } from '@/lib/blog';
import { scheduleDeletedBlogCleanup } from '@/lib/blogDeleteCleanup';
import { isValidBlogGenerationSession } from '@/lib/blogGenerationAuth';
import { verifyBotIdRequest } from '@/lib/botId';
import { ApiError, handleApiError, validateSchema } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import log from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const slugParamsSchema = z.object({
  slug: z.string().min(1)
});

async function validateSecret(request: NextRequest): Promise<void> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const blogGenerationSecret = process.env.BLOG_GENERATION_SECRET ?? cronSecret;
  const hasValidCookie = isValidBlogGenerationSession(request.cookies);
  const hasValidBearer =
    (cronSecret !== undefined && authHeader === `Bearer ${cronSecret}`) ||
    (blogGenerationSecret !== undefined && authHeader === `Bearer ${blogGenerationSecret}`);

  if (!hasValidCookie && !hasValidBearer) {
    log.warn('Unauthorized blog deletion attempt', {
      hasAuthHeader: !!authHeader,
      hasCookie: hasValidCookie,
      hasSecret: !!blogGenerationSecret
    });
    throw new ApiError(getErrorMessage('UNAUTHORIZED'), 401, 'UNAUTHORIZED');
  }
}

function createSanityWriteClient(): SanityClient {
  const apiToken = process.env.SANITY_API_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!apiToken || !projectId || !dataset) {
    log.error('Sanity environment variables missing for blog deletion', {
      hasApiToken: !!apiToken,
      hasDataset: !!dataset,
      hasProjectId: !!projectId
    });
    throw new ApiError(getErrorMessage('MISSING_SANITY_CONFIG'), 500, 'CONFIG_ERROR');
  }

  return createClient({
    apiVersion: '2025-10-08',
    dataset,
    projectId,
    token: apiToken,
    useCdn: false
  });
}

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
    const botIdResponse = await verifyBotIdRequest(request);
    if (botIdResponse) {
      return botIdResponse;
    }

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
      throw new ApiError(getErrorMessage('BLOG_POST_NOT_FOUND'), 404, 'NOT_FOUND');
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

/**
 * DELETE /api/blog/[slug]
 * Deletes a single blog post by slug for authorized admin sessions.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();
  const path = '/api/blog/[slug]';

  try {
    const botIdResponse = await verifyBotIdRequest(request, {
      allowAuthorizedServiceRequest: true
    });
    if (botIdResponse) {
      return botIdResponse;
    }

    const rateLimitResponse = await rateLimitMiddleware(request, 'BLOG_GENERATE');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await validateSecret(request);

    const resolvedParams = await params;
    const { slug } = validateSchema(slugParamsSchema, resolvedParams);

    log.request('DELETE', path, { slug });

    const post = await log.timeAsync(
      'Fetch blog post by slug for deletion',
      async () => await getBlogPostBySlug(slug),
      { slug }
    );

    if (!post) {
      throw new ApiError(getErrorMessage('BLOG_POST_NOT_FOUND'), 404, 'NOT_FOUND');
    }

    const writeClient = createSanityWriteClient();

    await log.timeAsync(
      'Delete blog post from Sanity',
      async () => await writeClient.delete(post._id),
      { postId: post._id, slug }
    );

    scheduleDeletedBlogCleanup(slug);
    revalidatePath('/');
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);

    const duration = Date.now() - startTime;
    log.response('DELETE', path, 200, {
      duration: `${duration}ms`,
      postId: post._id,
      slug,
      title: post.title
    });

    return NextResponse.json({
      deleted: {
        _id: post._id,
        slug,
        title: post.title
      },
      success: true
    });
  } catch (error) {
    return handleApiError(error, {
      method: 'DELETE',
      path,
      metadata: { duration: Date.now() - startTime }
    });
  }
}
