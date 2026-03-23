import { NextResponse, type NextRequest } from 'next/server';
import { FeedbackValue } from '@prisma/client';
import { z } from 'zod';

import { repositories } from '@/lib/db/repositories';
import { handleApiError, validateSchema } from '@/lib/errorHandler';
import { rateLimitMiddleware } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const feedbackSchema = z.discriminatedUnion('type', [
  z.object({
    messageId: z.string().trim().min(1),
    sessionKey: z.string().trim().min(1),
    type: z.literal('thumbs'),
    value: z.enum(['down', 'up'])
  }),
  z.object({
    citationId: z.string().trim().min(1),
    messageId: z.string().trim().optional(),
    sessionKey: z.string().trim().min(1),
    type: z.literal('citation_click'),
    url: z.string().trim().min(1)
  }),
  z.object({
    blogSlug: z.string().trim().optional(),
    pathname: z.string().trim().optional(),
    question: z.string().trim().min(1),
    sessionKey: z.string().trim().optional(),
    type: z.literal('no_result')
  })
]);

type FeedbackInput = z.infer<typeof feedbackSchema>;

async function getSessionId(input: FeedbackInput): Promise<string | undefined> {
  if (!('sessionKey' in input) || !input.sessionKey) {
    return undefined;
  }

  const session = await repositories.getChatSession(input.sessionKey);
  return session?.id;
}

async function persistFeedback(
  input: FeedbackInput,
  sessionId?: string
): Promise<NextResponse | undefined> {
  switch (input.type) {
    case 'thumbs':
      if (!sessionId) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      await repositories.createAnswerFeedback({
        messageId: input.messageId,
        sessionId,
        value: input.value === 'up' ? FeedbackValue.UP : FeedbackValue.DOWN
      });
      return undefined;

    case 'citation_click':
      if (!sessionId) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      await repositories.createCitationClick({
        citationId: input.citationId,
        messageId: input.messageId,
        sessionId,
        url: input.url
      });
      return undefined;

    case 'no_result':
      await repositories.createNoResultEvent({
        pagePath: input.pathname,
        pageSlug: input.blogSlug,
        question: input.question,
        sessionId
      });
      return undefined;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateLimitResponse = await rateLimitMiddleware(request, 'AI_FEEDBACK');

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body: unknown = await request.json();
    const input = validateSchema(feedbackSchema, body);
    const response = await persistFeedback(input, await getSessionId(input));

    if (response) {
      return response;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, {
      method: request.method,
      path: request.nextUrl.pathname
    });
  }
}
