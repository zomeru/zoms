import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient, type SanityClient } from '@sanity/client';

import {
  generateBlogContent,
  type BlogGenerationTriggerMode,
  type GeneratedBlogDraft
} from '@/lib/blog-generator';
import { isValidBlogGenerationSession } from '@/lib/blogGenerationAuth';
import { scheduleBlogReindex } from '@/lib/blogReindex';
import { verifyBotIdRequest } from '@/lib/botId';
import { ApiError, handleApiError, validateSchema } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import log from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { blogGenerateRequestSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel serverless function timeout

async function validateSecret(request: NextRequest): Promise<void> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const blogGenerationSecret = process.env.BLOG_GENERATION_SECRET ?? cronSecret;
  const hasValidCookie = isValidBlogGenerationSession(request.cookies);
  const hasValidBearer =
    (cronSecret !== undefined && authHeader === `Bearer ${cronSecret}`) ||
    (blogGenerationSecret !== undefined && authHeader === `Bearer ${blogGenerationSecret}`);

  if (!hasValidCookie && !hasValidBearer) {
    log.warn('Unauthorized blog generation attempt', {
      hasAuthHeader: !!authHeader,
      hasCookie: hasValidCookie,
      hasSecret: !!blogGenerationSecret
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
  content: GeneratedBlogDraft,
  triggerMode: BlogGenerationTriggerMode
) {
  const slug = await resolveUniqueBlogSlug(sanityClient, content.suggestedSlug || content.title);
  const sourceTrigger = triggerMode === 'scheduled' ? 'automated' : 'manual';

  return await sanityClient.create({
    _type: 'blogPost',
    title: content.title,
    slug: { _type: 'slug', current: slug },
    summary: content.summary,
    body: content.body, // Store raw markdown
    publishedAt: new Date().toISOString(),
    tags: content.tags,
    source: `${sourceTrigger}/${content.provider}`,
    generated: true,
    readTime: content.readTime
  });
}

function normalizeBlogSlug(value: string): string {
  const MAX_SLUG_LENGTH = 80;
  const sanitizedSlug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  if (sanitizedSlug.length === 0) {
    return 'generated-post';
  }

  if (sanitizedSlug.length <= MAX_SLUG_LENGTH) {
    return sanitizedSlug;
  }

  const truncatedSlug = sanitizedSlug.slice(0, MAX_SLUG_LENGTH).replace(/-[^-]*$/, '');

  return truncatedSlug.length > 0 ? truncatedSlug : sanitizedSlug.slice(0, MAX_SLUG_LENGTH);
}

async function resolveUniqueBlogSlug(
  sanityClient: SanityClient,
  candidate: string
): Promise<string> {
  const baseSlug = normalizeBlogSlug(candidate);
  const existingSlugs = await sanityClient.fetch<string[]>(
    `*[_type == "blogPost" && slug.current match $slugPattern].slug.current`,
    {
      slugPattern: `${baseSlug}*`
    }
  );
  const taken = new Set(existingSlugs);

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;

  while (taken.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }

  return `${baseSlug}-${counter}`;
}

async function handleGenerate(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const path = '/api/blog/generate';
  const method = request.method === 'GET' ? 'GET' : 'POST';

  try {
    const botIdResponse = await verifyBotIdRequest(request, {
      allowAuthorizedServiceRequest: true
    });

    if (botIdResponse) {
      return botIdResponse;
    }

    // Rate limiting - strict for blog generation
    const rateLimitResponse = await rateLimitMiddleware(request, 'BLOG_GENERATE');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    log.request(method, path);

    await validateSecret(request);

    let triggerMode: BlogGenerationTriggerMode = method === 'GET' ? 'scheduled' : 'manual';

    if (method === 'POST') {
      try {
        const body: unknown = await request.json();
        const validatedBody = validateSchema(blogGenerateRequestSchema, body);
        triggerMode = validatedBody.triggerMode;
      } catch {
        triggerMode = 'manual';
      }
    }

    const { apiToken, projectId, dataset } = validateSanityEnv();
    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion: '2026-03-31',
      token: apiToken,
      useCdn: false
    });

    log.info('Generating blog content', { triggerMode });

    const content = await log.timeAsync(
      'AI content generation',
      async () => await generateBlogContent(),
      { triggerMode }
    );

    log.info('Creating blog post in Sanity', {
      title: content.title,
      tags: content.tags
    });

    const newPost = await createBlogPost(writeClient, content, triggerMode);
    scheduleBlogReindex(newPost.slug.current);
    revalidatePath('/');
    revalidatePath('/blog');
    revalidatePath(`/blog/${newPost.slug.current}`);

    const duration = Date.now() - startTime;
    log.response(method, path, 200, {
      duration: `${duration}ms`,
      postId: newPost._id,
      title: newPost.title,
      triggerMode
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
