import { NextResponse, type NextRequest } from 'next/server';
import { createClient, type SanityClient } from '@sanity/client';

import { generateBlogContent, markdownToBlocks, type GeneratedBlogPost } from '@/lib/generateBlog';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel serverless function timeout

async function validateSecret(request: NextRequest): Promise<void> {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    throw new Error('Unauthorized access');
  }
}

function validateSanityEnv() {
  const apiToken = process.env.SANITY_API_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!apiToken || !projectId || !dataset) {
    throw new Error('Sanity write configuration is missing');
  }

  return { apiToken, projectId, dataset };
}

async function createBlogPost(
  sanityClient: SanityClient,
  content: GeneratedBlogPost,
  aiGenerated = true
) {
  const body = markdownToBlocks(content.body);

  const slug = content.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return await sanityClient.create({
    _type: 'blogPost',
    title: content.title,
    slug: { _type: 'slug', current: slug },
    summary: content.summary,
    body,
    publishedAt: new Date().toISOString(),
    tags: content.tags,
    source: aiGenerated ? 'automated/gemini' : 'manual',
    generated: aiGenerated,
    readTime: content.readTime
  });
}

async function handleGenerate(request: NextRequest): Promise<NextResponse> {
  try {
    await validateSecret(request);

    let aiGenerated = true;

    if (request.method === 'POST') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- We validate the structure below
        const body = (await request.json()) as unknown as { aiGenerated?: boolean };
        if (typeof body.aiGenerated === 'boolean') {
          aiGenerated = body.aiGenerated;
        }
      } catch {
        aiGenerated = true;
      }
    }

    const { apiToken, projectId, dataset } = validateSanityEnv();
    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      token: apiToken,
      useCdn: false
    });

    const content = await generateBlogContent();

    const newPost = await createBlogPost(writeClient, content, aiGenerated);

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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate blog post',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
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
