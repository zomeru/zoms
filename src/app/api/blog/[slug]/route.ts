import { NextResponse, type NextRequest } from 'next/server';

import { getBlogPostBySlug } from '@/lib/blog';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blog/[slug]
 * Returns a single blog post by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const post = await getBlogPostBySlug(slug);

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    // eslint-disable-next-line no-console -- Allow console for API errors
    console.error('Error in /api/blog/[slug]:', error);

    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}
