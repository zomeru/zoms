import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateBlogTransform } from '@/lib/ai/transform';
import { getBlogPostBySlug } from '@/lib/blog';
import { verifyBotIdRequest } from '@/lib/botId';
import { handleApiError, validateSchema } from '@/lib/errorHandler';
import { rateLimitMiddleware } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const transformRequestSchema = z.object({
  mode: z.enum(['advanced', 'beginner', 'tldr']),
  postSlug: z.string().trim().min(1)
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const botIdResponse = await verifyBotIdRequest(request);

  if (botIdResponse) {
    return botIdResponse;
  }

  const rateLimitResponse = await rateLimitMiddleware(request, 'AI_TRANSFORM');

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body: unknown = await request.json();
    const input = validateSchema(transformRequestSchema, body);
    const post = await getBlogPostBySlug(input.postSlug);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const transform = await generateBlogTransform({
      mode: input.mode,
      postTitle: post.title,
      sourceContent: [post.summary, post.body].filter(Boolean).join('\n\n')
    });

    return NextResponse.json(transform);
  } catch (error) {
    return handleApiError(error, {
      method: request.method,
      path: request.nextUrl.pathname
    });
  }
}
