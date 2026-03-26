/* eslint-disable max-lines -- this route owns the chat transport flow and related helpers */
import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { ChatMessageRole } from '@prisma/client';
import { z } from 'zod';

import { streamGeneralAnswer, streamGroundedAnswer } from '@/lib/ai/chat';
import { getDirectAssistantAnswer } from '@/lib/ai/directAnswers';
import { searchSessionMemory, storeSessionMemory } from '@/lib/ai/memory';
import { filterChatCitations } from '@/lib/ai/responseDecorations';
import type { Citation } from '@/lib/ai/schemas';
import { appendStreamText } from '@/lib/ai/streaming';
import { verifyBotIdRequest } from '@/lib/botId';
import { repositories } from '@/lib/db/repositories';
import { handleApiError, validateSchema } from '@/lib/errorHandler';
import { toPrismaJsonValue } from '@/lib/json';
import log from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import {
  classifyQueryIntent,
  isFollowUpQuery,
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
export const maxDuration = 60;

const AI_CHAT_COOKIE_NAME = 'ai_chat_session';
const chatRequestSchema = z.object({
  blogSlug: z.string().trim().optional(),
  pathname: z.string().trim().optional(),
  question: z.string().trim().min(1).max(2000)
});
const chatHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0)
});

interface ClientMessage {
  citations?: Citation[];
  content: string;
  id: string;
  messageId?: string;
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
    content: string;
    groundedAnswer?: unknown;
    id: string;
    citations?: unknown;
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
  return messages.slice(-4).map((message) => ({
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
  memoryContext?: string;
  pathname?: string;
  question: string;
}): Promise<{
  groundedAnswer: GroundedAnswerStream;
  retrievalMetadata: RetrievalMetadata;
}> {
  const followUpQuery = isFollowUpQuery(input.question);

  const directAnswer = await getDirectAssistantAnswer({
    classification: input.classification,
    query: input.question
  });

  if (directAnswer) {
    const visibleCitations = filterChatCitations({
      citations: directAnswer.citations,
      classification: input.classification,
      query: input.question
    });

    return {
      groundedAnswer: {
        ...directAnswer,
        citations: visibleCitations
      },
      retrievalMetadata: {
        classification: input.classification,
        directAnswer: true,
        matchCount: visibleCitations.length,
        matches: []
      }
    };
  }

  if (input.classification.intent === 'GENERAL_KNOWLEDGE_QUERY' && !followUpQuery) {
    const generalAnswer = await streamGeneralAnswer({
      conversationHistory: input.conversationHistory,
      memoryContext: input.memoryContext,
      query: input.question,
      relatedBlogChunks: []
    });

    return {
      groundedAnswer: {
        ...generalAnswer,
        citations: []
      },
      retrievalMetadata: {
        classification: input.classification,
        directAnswer: false,
        matchCount: 0,
        matches: []
      }
    };
  }

  if (input.classification.intent === 'GENERAL_KNOWLEDGE_QUERY') {
    const retrieval = await retrievePortfolio({
      currentBlogSlug: input.blogSlug,
      query: buildRetrievalQuery(input.question, input.conversationHistory),
      vectorQuery: async ({ filter, query, topK }) =>
        await getVectorIndexClient().query({ filter, query, topK })
    });
    const visibleCitations = filterChatCitations({
      citations: retrieval.citations,
      classification: input.classification,
      query: input.question
    });
    const groundedAnswer = await streamGroundedAnswer({
      citations: visibleCitations,
      classification: retrieval.classification,
      conversationHistory: input.conversationHistory,
      currentBlogSlug: input.blogSlug,
      memoryContext: input.memoryContext,
      query: input.question,
      shouldRefuse: retrieval.shouldRefuse,
      supportingChunks: retrieval.matches
    });

    return {
      groundedAnswer: {
        ...groundedAnswer,
        citations: visibleCitations
      },
      retrievalMetadata: {
        classification: retrieval.classification,
        directAnswer: false,
        matchCount: retrieval.matches.length,
        matches: retrieval.matches
      }
    };
  }

  const retrieval = await getRetriever(input.classification.intent)({
    currentBlogSlug: input.blogSlug,
    query: buildRetrievalQuery(input.question, input.conversationHistory),
    vectorQuery: async ({ filter, query, topK }) =>
      await getVectorIndexClient().query({ filter, query, topK })
  });
  const visibleCitations = filterChatCitations({
    citations: retrieval.citations,
    classification: retrieval.classification,
    query: input.question
  });
  const groundedAnswer = await streamGroundedAnswer({
    citations: visibleCitations,
    classification: retrieval.classification,
    conversationHistory: input.conversationHistory,
    currentBlogSlug: input.blogSlug,
    memoryContext: input.memoryContext,
    query: input.question,
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

          answerText = appendStreamText(answerText, part);
          sendEvent({ text: part, type: 'chunk' });
        }

        const finalAnswer = {
          answer:
            answerText.trim() ||
            'I can only answer from content that is currently indexed on this site.',
          citations: input.groundedAnswer.citations,
          supported: input.groundedAnswer.supported
        };
        const assistantMessage = await repositories.createChatMessage({
          citations: finalAnswer.citations,
          content: finalAnswer.answer,
          groundedAnswer: finalAnswer,
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
        try {
          await storeSessionMemory({
            answer: finalAnswer.answer,
            question: input.input.question,
            sessionKey: input.sessionKey
          });
        } catch (memoryError) {
          log.warn('Failed to store session memory', {
            sessionKey: input.sessionKey,
            error: memoryError instanceof Error ? memoryError.message : String(memoryError)
          });
        }

        sendEvent({ answer: finalAnswer, messageId: assistantMessage.id, type: 'done' });
      } catch {
        sendEvent({
          answer: {
            answer:
              answerText.trim() || 'Unable to complete the assistant response. Please try again.',
            citations: [],
            supported: false
          },
          type: 'done'
        });
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
    const botIdResponse = await verifyBotIdRequest(request);
    if (botIdResponse) {
      return botIdResponse;
    }

    const sessionKey =
      request.nextUrl.searchParams.get('sessionKey') ??
      request.cookies.get(AI_CHAT_COOKIE_NAME)?.value;
    const { limit, offset } = validateSchema(
      chatHistoryQuerySchema,
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    if (!sessionKey) {
      return NextResponse.json({
        hasMore: false,
        limit,
        messages: [],
        offset,
        sessionKey: null,
        total: 0
      });
    }

    const page = await repositories.getChatHistoryPage(sessionKey, {
      limit,
      offset
    });

    return NextResponse.json({
      hasMore: page.hasMore,
      limit,
      messages: mapStoredMessages(page.messages),
      offset,
      sessionKey,
      total: page.total
    });
  } catch (error) {
    return handleApiError(error, {
      method: request.method,
      path: request.nextUrl.pathname
    });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const botIdResponse = await verifyBotIdRequest(request);

  if (botIdResponse) {
    return botIdResponse;
  }

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
    const previousMessages =
      isNew || sessionKey.length === 0
        ? []
        : await repositories.getRecentChatMessages(sessionKey, 4);
    const conversationHistory = buildConversationHistory(mapStoredMessages(previousMessages));
    const followUpQuery = isFollowUpQuery(input.question);
    let memoryContext = '';

    if (conversationHistory.length > 0 && followUpQuery) {
      try {
        const sessionMemories = await searchSessionMemory({
          limit: 3,
          query: input.question,
          sessionKey
        });

        memoryContext = sessionMemories.join('\n');
      } catch (memoryError) {
        log.warn('Failed to search session memory', {
          sessionKey,
          error: memoryError instanceof Error ? memoryError.message : String(memoryError)
        });
      }
    }

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
      memoryContext,
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
