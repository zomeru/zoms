import { buildConversationHistory, mapStoredMessages } from "@/lib/ai/chat/messages";
import { resolveChatHistoryLimit } from "@/lib/ai/chat/metaQuestion";
import { resolveGroundedAnswer } from "@/lib/ai/chat/retrieval";
import type { ChatRequestInput } from "@/lib/ai/chat/schemas";
import { createStreamingChatResponse } from "@/lib/ai/chat/streamResponse";
import { searchSessionMemory } from "@/lib/ai/memory";
import { repositories } from "@/lib/db/repositories";
import log from "@/lib/logger";
import { classifyQueryIntent, isFollowUpQuery } from "@/lib/retrieval/classify";

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
  let memoryContext = "";

  if (conversationHistory.length > 0 && followUpQuery) {
    try {
      const sessionMemories = await searchSessionMemory({
        limit: 3,
        query: input.body.question,
        sessionKey: input.sessionKey
      });

      memoryContext = sessionMemories.join("\n");
    } catch (memoryError) {
      log.warn("Failed to search session memory", {
        sessionKey: input.sessionKey,
        error: memoryError instanceof Error ? memoryError.message : String(memoryError)
      });
    }
  }

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
