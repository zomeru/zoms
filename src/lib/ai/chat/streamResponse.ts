import { ChatMessageRole } from "@/generated/prisma/client";

import type { streamGroundedAnswer } from "@/lib/ai/chat-stream";
import { storeSessionMemory } from "@/lib/ai/memory";
import { appendStreamText } from "@/lib/ai/streaming";
import { repositories } from "@/lib/db/repositories";
import { toPrismaJsonValue } from "@/lib/json";
import log from "@/lib/logger";
import type { QueryClassification } from "@/lib/retrieval/classify";

import type { RetrievalMetadata } from "./retrieval";
import { AI_CHAT_COOKIE_NAME, type ChatRequestInput } from "./schemas";

type GroundedAnswerStream = Awaited<ReturnType<typeof streamGroundedAnswer>>;

export function createStreamingChatResponse(input: {
  classification: QueryClassification;
  groundedAnswer: GroundedAnswerStream;
  input: ChatRequestInput;
  isNew: boolean;
  retrievalMetadata: RetrievalMetadata;
  sessionId: string;
  sessionKey: string;
  userMessageId: string;
}): Response {
  const encoder = new TextEncoder();
  const setCookieHeader = input.isNew
    ? `${AI_CHAT_COOKIE_NAME}=${input.sessionKey}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    : undefined;
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };
      let answerText = "";

      try {
        for await (const part of input.groundedAnswer.textStream) {
          if (!part) {
            continue;
          }

          answerText = appendStreamText(answerText, part);
          sendEvent({ text: part, type: "chunk" });
        }

        const finalAnswer = {
          answer:
            answerText.trim() ||
            "I can only answer from content that is currently indexed on this site.",
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

        sendEvent({ answer: finalAnswer, messageId: assistantMessage.id, type: "done" });

        try {
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
        } catch (retrievalError) {
          log.warn("Failed to persist retrieval event", {
            assistantMessageId: assistantMessage.id,
            error: retrievalError instanceof Error ? retrievalError.message : String(retrievalError)
          });
        }

        try {
          await storeSessionMemory({
            answer: finalAnswer.answer,
            question: input.input.question,
            sessionKey: input.sessionKey
          });
        } catch (memoryError) {
          log.warn("Failed to store session memory", {
            sessionKey: input.sessionKey,
            error: memoryError instanceof Error ? memoryError.message : String(memoryError)
          });
        }
      } catch {
        sendEvent({
          answer: {
            answer:
              answerText.trim() || "Unable to complete the assistant response. Please try again.",
            citations: [],
            supported: false
          },
          type: "done"
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Accel-Buffering": "no",
      ...(setCookieHeader
        ? {
            "Set-Cookie": setCookieHeader
          }
        : {})
    },
    status: 200
  });
}
