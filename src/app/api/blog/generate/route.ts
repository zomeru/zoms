import { NextResponse, type NextRequest } from 'next/server';
import { createClient, type SanityClient } from '@sanity/client';

import { ApiError, handleApiError, validateSchema } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { generateBlogContent, type GeneratedBlogPost } from '@/lib/generateBlog';
import log from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { blogGenerateRequestSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel serverless function timeout

async function validateSecret(request: NextRequest): Promise<void> {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  // Only enforce in non-development environments
  if ((!secret || authHeader !== `Bearer ${secret}`) && process.env.NODE_ENV !== 'development') {
    log.warn('Unauthorized blog generation attempt', {
      hasAuthHeader: !!authHeader,
      hasSecret: !!secret
    });
    throw new ApiError(getErrorMessage('UNAUTHORIZED'), 401, 'UNAUTHORIZED');
  }
}

function validateSanityEnv() {
  const apiToken = process.env.SANITY_API_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!apiToken || !projectId || !dataset) {
    log.error('Sanity environment variables missing', {
      hasApiToken: !!apiToken,
      hasProjectId: !!projectId,
      hasDataset: !!dataset
    });
    throw new ApiError(getErrorMessage('MISSING_SANITY_CONFIG'), 500, 'CONFIG_ERROR');
  }

  return { apiToken, projectId, dataset };
}

async function createBlogPost(
  sanityClient: SanityClient,
  content: GeneratedBlogPost,
  aiGenerated = true
) {
  // Store markdown directly instead of converting to blocks
  const slug = content.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return await sanityClient.create({
    _type: 'blogPost',
    title: content.title,
    slug: { _type: 'slug', current: slug },
    summary: content.summary,
    bodyMarkdown: content.bodyMarkdown, // Store raw markdown
    publishedAt: new Date().toISOString(),
    tags: content.tags,
    source: aiGenerated ? 'automated/gemini' : 'manual',
    generated: aiGenerated,
    readTime: content.readTime
  });
}

async function handleGenerate(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const path = '/api/blog/generate';
  const method = request.method === 'GET' ? 'GET' : 'POST';

  try {
    // Rate limiting - strict for blog generation
    const rateLimitResponse = await rateLimitMiddleware(request, 'BLOG_GENERATE');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    log.request(method, path);

    await validateSecret(request);

    let aiGenerated = true;

    if (method === 'POST') {
      try {
        const body: unknown = await request.json();
        const validatedBody = validateSchema(blogGenerateRequestSchema, body);
        aiGenerated = validatedBody.aiGenerated;
      } catch {
        // Default to true if validation fails
        aiGenerated = true;
      }
    }

    const { apiToken, projectId, dataset } = validateSanityEnv();
    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion: '2025-10-08',
      token: apiToken,
      useCdn: false
    });

    log.info('Generating blog content', { aiGenerated });

    const content = await log.timeAsync(
      'AI content generation',
      async () => await generateBlogContent(),
      { aiGenerated }
    );

    log.info('Creating blog post in Sanity', {
      title: content.title,
      tags: content.tags
    });

    const newPost = await createBlogPost(writeClient, content, aiGenerated);

    const duration = Date.now() - startTime;
    log.response(method, path, 200, {
      duration: `${duration}ms`,
      postId: newPost._id,
      title: newPost.title,
      aiGenerated
    });

    return NextResponse.json({
      success: true,
      post: {
        _id: newPost._id,
        title: newPost.title,
        slug: newPost.slug,
        summary: content.summary,
        publishedAt: newPost.publishedAt,
        tags: newPost.tags,
        generated: newPost.generated,
        readTime: newPost.readTime
      }
    });
  } catch (error) {
    return handleApiError(error, {
      method,
      path,
      metadata: { duration: Date.now() - startTime }
    });
  }
}

// GET handler for Vercel Cron (cron jobs send GET requests)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return await handleGenerate(request);
}

// POST handler for manual API calls (UI button)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return await handleGenerate(request);
}
