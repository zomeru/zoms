import { ChatMessageRole } from "@/generated/prisma/client";

import type { Citation } from "@/lib/ai/schemas";

export interface ClientMessage {
  citations?: Citation[];
  content: string;
  id: string;
  messageId?: string;
  role: "assistant" | "user";
  supported?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapStoredMessages(
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
      typeof groundedAnswer?.supported === "boolean" ? groundedAnswer.supported : undefined;

    return [
      {
        citations: Array.isArray(message.citations) ? message.citations : undefined,
        content: message.content,
        id: message.id,
        messageId: message.role === ChatMessageRole.ASSISTANT ? message.id : undefined,
        role: message.role === ChatMessageRole.USER ? "user" : "assistant",
        supported
      }
    ];
  });
}

export function buildConversationHistory(messages: ClientMessage[]): Array<{
  content: string;
  role: "assistant" | "user";
}> {
  return messages.slice(-4).map((message) => ({
    content: message.content,
    role: message.role
  }));
}
