import { NextResponse, type NextRequest } from 'next/server';
import { createClient, type SanityClient } from '@sanity/client';

import {
  fetchTrendingTopics,
  generateBlogContent,
  markdownToBlocks,
  type GeneratedBlogPost
} from '@/lib/generateBlog';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel serverless function timeout

async function validateSecret(request: NextRequest): Promise<string | null> {
  const cronSecret = request.headers.get('x-vercel-cron-secret');
  const secret = process.env.BLOG_GENERATION_SECRET;

  if (!secret) {
    throw new Error('Blog generation is not configured');
  }

  if (process.env.NODE_ENV === 'production' && (!cronSecret || cronSecret !== secret)) {
    throw new Error('Authorization is required');
  }

  return secret;
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

async function createBlogPost(writeClient: SanityClient, content: GeneratedBlogPost) {
  const body = markdownToBlocks(content.body);

  const slug = content.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // eslint-disable-next-line @typescript-eslint/return-await -- Directly return the promise
  return writeClient.create({
    _type: 'blogPost',
    title: content.title,
    slug: { _type: 'slug', current: slug },
    summary: content.summary,
    body,
    publishedAt: new Date().toISOString(),
    tags: content.tags,
    source: 'automated/gemini',
    generated: true
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await validateSecret(request);

    const { apiToken, projectId, dataset } = validateSanityEnv();
    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      token: apiToken,
      useCdn: false
    });

    const topics = await fetchTrendingTopics();
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const content = await generateBlogContent(randomTopic);

    const newPost = await createBlogPost(writeClient, content);

    return NextResponse.json({
      success: true,
      post: {
        _id: newPost._id,
        title: newPost.title,
        slug: newPost.slug,
        summary: content.summary
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
