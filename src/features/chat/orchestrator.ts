import { buildConversationHistory, mapStoredMessages } from "@/lib/ai/chat/messages";
import { resolveChatHistoryLimit } from "@/lib/ai/chat/metaQuestion";
import { resolveGroundedAnswer } from "@/lib/ai/chat/retrieval";
import type { ChatRequestInput } from "@/lib/ai/chat/schemas";
import { createStreamingChatResponse } from "@/lib/ai/chat/streamResponse";
import { searchSessionMemory } from "@/lib/ai/memory";
import { repositories } from "@/lib/db/repositories";
import log from "@/lib/logger";
import { fromThrowable, ok, type Result } from "@/lib/result";
import { classifyQueryIntent, isFollowUpQuery } from "@/lib/retrieval/classify";

async function resolveMemoryContext(input: {
  conversationHistoryLength: number;
  isFollowUp: boolean;
  question: string;
  sessionKey: string;
}): Promise<Result<string, unknown>> {
  if (input.conversationHistoryLength === 0 || !input.isFollowUp) {
    return ok("");
  }

  const memorySearchResult = await fromThrowable(async () =>
    searchSessionMemory({
      limit: 3,
      query: input.question,
      sessionKey: input.sessionKey
    })
  );

  if (!memorySearchResult.ok) {
    return memorySearchResult;
  }

  return ok(memorySearchResult.data.join("\n"));
}

export async function handleChatPost(input: {
  body: ChatRequestInput;
  isNew: boolean;
  sessionKey: string;
}): Promise<Response> {
  const historyLimit = resolveChatHistoryLimit(input.body.question);
  const previousMessages =
    input.isNew || input.sessionKey.length === 0
      ? []
      : await repositories.getRecentChatMessages(input.sessionKey, historyLimit);
  const conversationHistory = buildConversationHistory(mapStoredMessages(previousMessages));
  const followUpQuery = isFollowUpQuery(input.body.question);
  const memoryContextResult = await resolveMemoryContext({
    conversationHistoryLength: conversationHistory.length,
    isFollowUp: followUpQuery,
    question: input.body.question,
    sessionKey: input.sessionKey
  });

  if (!memoryContextResult.ok) {
    log.warn("Failed to search session memory", {
      sessionKey: input.sessionKey,
      error:
        memoryContextResult.error instanceof Error
          ? memoryContextResult.error.message
          : String(memoryContextResult.error)
    });
  }

  const memoryContext = memoryContextResult.ok ? memoryContextResult.data : "";
  const userTurn = await repositories.createUserTurn({
    blogSlugHint: input.body.blogSlug,
    pathnameHint: input.body.pathname,
    question: input.body.question,
    sessionKey: input.sessionKey
  });
  const classification = classifyQueryIntent(input.body.question);
  const { groundedAnswer, retrievalMetadata } = await resolveGroundedAnswer({
    blogSlug: input.body.blogSlug,
    classification,
    conversationHistory,
    memoryContext,
    pathname: input.body.pathname,
    question: input.body.question
  });

  return createStreamingChatResponse({
    classification,
    groundedAnswer,
    input: input.body,
    isNew: input.isNew,
    retrievalMetadata,
    sessionId: userTurn.sessionId,
    sessionKey: input.sessionKey,
    userMessageId: userTurn.userMessageId
  });
}
