import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

import { ChatMessageRole } from "@/generated/prisma/client";

import { buildConversationHistory, mapStoredMessages } from "@/lib/ai/chat/messages";
import { resolveChatHistoryLimit } from "@/lib/ai/chat/metaQuestion";
import { resolveGroundedAnswer } from "@/lib/ai/chat/retrieval";
import {
  AI_CHAT_COOKIE_NAME,
  chatHistoryQuerySchema,
  chatRequestSchema
} from "@/lib/ai/chat/schemas";
import { createStreamingChatResponse } from "@/lib/ai/chat/streamResponse";
import { searchSessionMemory } from "@/lib/ai/memory";
import { verifyBotIdRequest } from "@/lib/botId";
import { repositories } from "@/lib/db/repositories";
import { handleApiError, validateSchema } from "@/lib/errorHandler";
import log from "@/lib/logger";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { classifyQueryIntent, isFollowUpQuery } from "@/lib/retrieval/classify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getSessionKey(request: NextRequest): { isNew: boolean; sessionKey: string } {
  const existing = request.cookies.get(AI_CHAT_COOKIE_NAME)?.value;

  if (existing) {
    return { isNew: false, sessionKey: existing };
  }

  return { isNew: true, sessionKey: randomUUID() };
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const botIdResponse = await verifyBotIdRequest(request);
    if (botIdResponse) {
      return botIdResponse;
    }

    const sessionKey = request.cookies.get(AI_CHAT_COOKIE_NAME)?.value;
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

    const page = await repositories.getChatHistoryPage(sessionKey, { limit, offset });

    return NextResponse.json({
      hasMore: page.hasMore,
      limit,
      messages: mapStoredMessages(page.messages),
      offset,
      sessionKey: null,
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

  const rateLimitResponse = await rateLimitMiddleware(request, "AI_CHAT");

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
    const historyLimit = resolveChatHistoryLimit(input.question);
    const previousMessages =
      isNew || sessionKey.length === 0
        ? []
        : await repositories.getRecentChatMessages(sessionKey, historyLimit);
    const conversationHistory = buildConversationHistory(mapStoredMessages(previousMessages));
    const followUpQuery = isFollowUpQuery(input.question);
    let memoryContext = "";

    if (conversationHistory.length > 0 && followUpQuery) {
      try {
        const sessionMemories = await searchSessionMemory({
          limit: 3,
          query: input.question,
          sessionKey
        });

        memoryContext = sessionMemories.join("\n");
      } catch (memoryError) {
        log.warn("Failed to search session memory", {
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
