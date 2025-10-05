import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@sanity/client';

import { fetchTrendingTopics, generateBlogContent, markdownToBlocks } from '@/lib/generateBlog';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel serverless function timeout

/**
 * POST /api/blog/generate
 * Generates a new blog post using Gemini AI
 * Protected by BLOG_GENERATION_SECRET
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify secret
    const authHeader = request.headers.get('authorization');
    const secret = process.env.BLOG_GENERATION_SECRET;

    if (!secret) {
      return NextResponse.json({ error: 'Blog generation is not configured' }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for required environment variables
    const apiToken = process.env.SANITY_API_TOKEN;
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

    if (!apiToken || !projectId || !dataset) {
      return NextResponse.json({ error: 'Sanity write configuration is missing' }, { status: 500 });
    }

    // Create Sanity client with write access
    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      token: apiToken,
      useCdn: false
    });

    // Fetch trending topics
    const topics = await fetchTrendingTopics();
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    // Generate blog content using Gemini
    const content = await generateBlogContent(randomTopic);

    // Convert markdown to Sanity blocks
    const body = markdownToBlocks(content.body);

    // Create slug from title
    const slug = content.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create the blog post in Sanity
    const newPost = await writeClient.create({
      _type: 'blogPost',
      title: content.title,
      slug: {
        _type: 'slug',
        current: slug
      },
      summary: content.summary,
      body,
      publishedAt: new Date().toISOString(),
      tags: content.tags,
      source: 'automated/gemini',
      generated: true
    });

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
    // eslint-disable-next-line no-console -- Allow console for API errors
    console.error('Error generating blog post:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate blog post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
