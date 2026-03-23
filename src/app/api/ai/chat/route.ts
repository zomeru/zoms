import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { ChatMessageRole } from '@prisma/client';
import { z } from 'zod';

import { buildRelatedContent, streamGroundedAnswer } from '@/lib/ai/chat';
import { getDirectAssistantAnswer } from '@/lib/ai/directAnswers';
import type { Citation, RelatedContentItem } from '@/lib/ai/schemas';
import { repositories } from '@/lib/db/repositories';
import { handleApiError, validateSchema } from '@/lib/errorHandler';
import { toPrismaJsonValue } from '@/lib/json';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import {
  classifyQueryIntent,
  type QueryClassification,
  type QueryIntent
} from '@/lib/retrieval/classify';
import {
  retrieveBlogs,
  retrieveExperience,
  retrievePortfolio,
  retrieveProjects
} from '@/lib/retrieval/search';
import type { RetrievedChunk } from '@/lib/retrieval/types';
import { getVectorIndexClient } from '@/lib/vector/index';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const AI_CHAT_COOKIE_NAME = 'ai_chat_session';
const chatRequestSchema = z.object({
  blogSlug: z.string().trim().optional(),
  pathname: z.string().trim().optional(),
  question: z.string().trim().min(1)
});

interface ClientMessage {
  citations?: Citation[];
  content: string;
  id: string;
  messageId?: string;
  relatedContent?: RelatedContentItem[];
  role: 'assistant' | 'user';
  supported?: boolean;
}

type GroundedAnswerStream = Awaited<ReturnType<typeof streamGroundedAnswer>>;

interface RetrievalMetadata {
  classification: QueryClassification;
  directAnswer: boolean;
  matchCount: number;
  matches: RetrievedChunk[];
}

function getSessionKey(request: NextRequest): { isNew: boolean; sessionKey: string } {
  const existing = request.cookies.get(AI_CHAT_COOKIE_NAME)?.value;

  if (existing) {
    return {
      isNew: false,
      sessionKey: existing
    };
  }

  return {
    isNew: true,
    sessionKey: randomUUID()
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapStoredMessages(
  messages: Array<{
    citations?: unknown;
    content: string;
    groundedAnswer?: unknown;
    id: string;
    relatedContent?: unknown;
    role: ChatMessageRole;
  }>
): ClientMessage[] {
  return messages.flatMap((message) => {
    if (message.role !== ChatMessageRole.USER && message.role !== ChatMessageRole.ASSISTANT) {
      return [];
    }

    const groundedAnswer = isRecord(message.groundedAnswer) ? message.groundedAnswer : undefined;
    const supported =
      typeof groundedAnswer?.supported === 'boolean' ? groundedAnswer.supported : undefined;

    return [
      {
        citations: Array.isArray(message.citations) ? message.citations : undefined,
        content: message.content,
        id: message.id,
        messageId: message.role === ChatMessageRole.ASSISTANT ? message.id : undefined,
        relatedContent: Array.isArray(message.relatedContent) ? message.relatedContent : undefined,
        role: message.role === ChatMessageRole.USER ? 'user' : 'assistant',
        supported
      }
    ];
  });
}

function buildConversationHistory(messages: ClientMessage[]): Array<{
  content: string;
  role: 'assistant' | 'user';
}> {
  return messages.slice(-6).map((message) => ({
    content: message.content,
    role: message.role
  }));
}

function buildRetrievalQuery(
  question: string,
  conversationHistory: ReturnType<typeof buildConversationHistory>
): string {
  if (conversationHistory.length === 0) {
    return question;
  }

  return [
    'Conversation history:',
    ...conversationHistory.map(
      (message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`
    ),
    `Current question: ${question}`
  ].join('\n');
}

function getRetriever(intent: QueryIntent) {
  switch (intent) {
    case 'EXPERIENCE_QUERY':
      return retrieveExperience;
    case 'PROJECT_QUERY':
      return retrieveProjects;
    case 'BLOG_QUERY':
      return retrieveBlogs;
    default:
      return retrievePortfolio;
  }
}

async function resolveGroundedAnswer(input: {
  blogSlug?: string;
  classification: QueryClassification;
  conversationHistory: ReturnType<typeof buildConversationHistory>;
  pathname?: string;
  question: string;
}): Promise<{
  groundedAnswer: GroundedAnswerStream;
  retrievalMetadata: RetrievalMetadata;
}> {
  const directAnswer = await getDirectAssistantAnswer({
    classification: input.classification,
    query: input.question
  });

  if (directAnswer) {
    return {
      groundedAnswer: directAnswer,
      retrievalMetadata: {
        classification: input.classification,
        directAnswer: true,
        matchCount: directAnswer.citations.length,
        matches: []
      }
    };
  }

  const retrieval = await getRetriever(input.classification.intent)({
    currentBlogSlug: input.blogSlug,
    query: buildRetrievalQuery(input.question, input.conversationHistory),
    vectorQuery: async ({ filter, query, topK }) =>
      await getVectorIndexClient().query({ filter, query, topK })
  });
  const relatedContent = buildRelatedContent(
    retrieval.matches.filter((match) => match.slug !== input.blogSlug)
  );
  const groundedAnswer = await streamGroundedAnswer({
    citations: retrieval.citations,
    classification: retrieval.classification,
    conversationHistory: input.conversationHistory,
    currentBlogSlug: input.blogSlug,
    query: input.question,
    relatedContent,
    shouldRefuse: retrieval.shouldRefuse,
    supportingChunks: retrieval.matches
  });

  return {
    groundedAnswer,
    retrievalMetadata: {
      classification: retrieval.classification,
      directAnswer: false,
      matchCount: retrieval.matches.length,
      matches: retrieval.matches
    }
  };
}

function createStreamingChatResponse(input: {
  classification: QueryClassification;
  groundedAnswer: GroundedAnswerStream;
  input: z.infer<typeof chatRequestSchema>;
  isNew: boolean;
  retrievalMetadata: RetrievalMetadata;
  sessionId: string;
  sessionKey: string;
  userMessageId: string;
}): Response {
  const encoder = new TextEncoder();
  const setCookieHeader = input.isNew
    ? `${AI_CHAT_COOKIE_NAME}=${input.sessionKey}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    : undefined;
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };
      let answerText = '';

      try {
        sendEvent({ sessionKey: input.sessionKey, type: 'session' });

        for await (const part of input.groundedAnswer.textStream) {
          if (!part) {
            continue;
          }

          answerText += part;
          sendEvent({ text: part, type: 'chunk' });
        }

        const finalAnswer = {
          answer:
            answerText.trim() ||
            'I can only answer from content that is currently indexed on this site.',
          citations: input.groundedAnswer.citations,
          relatedContent: input.groundedAnswer.relatedContent,
          supported: input.groundedAnswer.supported
        };
        const assistantMessage = await repositories.createChatMessage({
          citations: finalAnswer.citations,
          content: finalAnswer.answer,
          groundedAnswer: finalAnswer,
          relatedContent: finalAnswer.relatedContent,
          role: ChatMessageRole.ASSISTANT,
          sessionId: input.sessionId
        });

        await repositories.createRetrievalEvent({
          assistantMessageId: assistantMessage.id,
          matchCount: input.retrievalMetadata.matchCount,
          noAnswer: !finalAnswer.supported,
          pagePath: input.input.pathname,
          pageSlug: input.input.blogSlug,
          payload: toPrismaJsonValue({
            citations: finalAnswer.citations,
            classification: input.retrievalMetadata.classification,
            directAnswer: input.retrievalMetadata.directAnswer,
            matches: input.retrievalMetadata.matches
          }),
          query: input.input.question,
          sessionId: input.sessionId,
          userMessageId: input.userMessageId
        });

        if (!finalAnswer.supported) {
          await repositories.createNoResultEvent({
            pagePath: input.input.pathname,
            pageSlug: input.input.blogSlug,
            question: input.input.question,
            sessionId: input.sessionId
          });
        }

        sendEvent({ answer: finalAnswer, messageId: assistantMessage.id, type: 'done' });
      } catch (error) {
        sendEvent({
          answer: {
            answer:
              answerText.trim() || 'Unable to complete the assistant response. Please try again.',
            citations: [],
            relatedContent: [],
            supported: false
          },
          type: 'done'
        });

        if (!answerText.trim()) {
          await repositories.createNoResultEvent({
            pagePath: input.input.pathname,
            pageSlug: input.input.blogSlug,
            payload: toPrismaJsonValue({
              classification: input.retrievalMetadata.classification,
              error: error instanceof Error ? error.message : String(error)
            }),
            question: input.input.question,
            sessionId: input.sessionId
          });
        }
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'X-Accel-Buffering': 'no',
      ...(setCookieHeader
        ? {
            'Set-Cookie': setCookieHeader
          }
        : {})
    },
    status: 200
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const sessionKey =
      request.nextUrl.searchParams.get('sessionKey') ??
      request.cookies.get(AI_CHAT_COOKIE_NAME)?.value;

    if (!sessionKey) {
      return NextResponse.json({
        messages: [],
        sessionKey: null
      });
    }

    const session = await repositories.getChatSession(sessionKey);

    return NextResponse.json({
      messages: mapStoredMessages(session?.messages ?? []),
      sessionKey
    });
  } catch (error) {
    return handleApiError(error, {
      method: request.method,
      path: request.nextUrl.pathname
    });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const rateLimitResponse = await rateLimitMiddleware(request, 'AI_CHAT');

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body: unknown = await request.json();
    const input = validateSchema(chatRequestSchema, body);
    const { sessionKey, isNew } = getSessionKey(request);
    const session = await repositories.touchChatSession({
      blogSlugHint: input.blogSlug,
      pathnameHint: input.pathname,
      sessionKey
    });
    const previousSession =
      isNew || sessionKey.length === 0 ? null : await repositories.getChatSession(sessionKey);
    const conversationHistory = buildConversationHistory(
      mapStoredMessages(previousSession?.messages ?? [])
    );

    const userMessage = await repositories.createChatMessage({
      content: input.question,
      role: ChatMessageRole.USER,
      sessionId: session.id
    });
    const classification = classifyQueryIntent(input.question);
    const { groundedAnswer, retrievalMetadata } = await resolveGroundedAnswer({
      blogSlug: input.blogSlug,
      classification,
      conversationHistory,
      pathname: input.pathname,
      question: input.question
    });
    return createStreamingChatResponse({
      classification,
      groundedAnswer,
      input,
      isNew,
      retrievalMetadata,
      sessionId: session.id,
      sessionKey,
      userMessageId: userMessage.id
    });
  } catch (error) {
    return handleApiError(error, {
      method: request.method,
      path: request.nextUrl.pathname
    });
  }
}
