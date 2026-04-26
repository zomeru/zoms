import { type NextRequest, NextResponse } from "next/server";
import { handleChatPost } from "@/features/chat/orchestrator";
import { getSessionKey } from "@/features/chat/session";
import { mapStoredMessages } from "@/lib/ai/chat/messages";
import {
  AI_CHAT_COOKIE_NAME,
  chatHistoryQuerySchema,
  chatRequestSchema
} from "@/lib/ai/chat/schemas";
import { verifyBotIdRequest } from "@/lib/botId";
import { repositories } from "@/lib/db/repositories";
import { handleApiError, validateSchema } from "@/lib/errorHandler";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    return await handleChatPost({
      body: input,
      isNew,
      sessionKey
    });
  } catch (error) {
    return handleApiError(error, {
      method: request.method,
      path: request.nextUrl.pathname
    });
  }
}
