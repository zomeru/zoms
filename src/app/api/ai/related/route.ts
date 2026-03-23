import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { buildRelatedContent } from '@/lib/ai/chat';
import { relatedContentItemSchema } from '@/lib/ai/schemas';
import { getBlogPostBySlug } from '@/lib/blog';
import { withQueryCache } from '@/lib/cache/queryCache';
import { handleApiError, validateSchema } from '@/lib/errorHandler';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { retrieveRelevantChunks } from '@/lib/retrieval/search';
import { getVectorIndexClient } from '@/lib/vector/index';

export const dynamic = 'force-dynamic';

const relatedQuerySchema = z.object({
  blogSlug: z.string().trim().optional(),
  pathname: z.string().trim().optional()
});
const relatedResponseSchema = z.object({
  relatedContent: z.array(relatedContentItemSchema)
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rateLimitResponse = await rateLimitMiddleware(request, 'AI_RELATED');

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const input = validateSchema(
      relatedQuerySchema,
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    if (!input.blogSlug && !input.pathname) {
      return NextResponse.json({ error: 'blogSlug or pathname is required' }, { status: 400 });
    }

    const cacheKey = `related:${input.blogSlug ?? ''}:${input.pathname ?? ''}`;
    const result = await withQueryCache(
      cacheKey,
      async () => {
        const sourcePost = input.blogSlug ? await getBlogPostBySlug(input.blogSlug) : null;

        if (input.blogSlug && !sourcePost) {
          return null;
        }

        const query =
          sourcePost?.title && sourcePost.summary
            ? `${sourcePost.title} ${sourcePost.summary} ${(sourcePost.tags ?? []).join(' ')}`
            : (input.pathname ?? '');
        const retrieval = await retrieveRelevantChunks({
          currentBlogSlug: input.blogSlug,
          query,
          vectorQuery: async ({ query: relatedQuery, topK }) =>
            await getVectorIndexClient().query({ query: relatedQuery, topK })
        });

        return {
          relatedContent: buildRelatedContent(
            retrieval.matches.filter((match) => match.slug !== input.blogSlug)
          )
        };
      },
      {
        parse(value) {
          const parsed = z.nullable(relatedResponseSchema).safeParse(value);
          return parsed.success ? parsed.data : undefined;
        }
      }
    );

    if (!result) {
      return NextResponse.json({ error: 'Source content not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, {
      method: request.method,
      path: request.nextUrl.pathname
    });
  }
}
