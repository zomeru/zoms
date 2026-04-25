import type { Citation, TransformResult } from "@/lib/ai/schemas";
import { isRecord } from "@/lib/utils";

export interface AssistantMessage {
  citations?: Citation[];
  content: string;
  id: string;
  isPending?: boolean;
  messageId?: string;
  role: "assistant" | "user";
  supported?: boolean;
  transform?: TransformResult;
}

export interface ChatHistoryResponse {
  hasMore: boolean;
  limit: number;
  messages: AssistantMessage[];
  offset: number;
  sessionKey: string | null;
  total: number;
}

export interface StreamEvent {
  answer?: {
    answer: string;
    citations: Citation[];
    supported: boolean;
  };
  messageId?: string;
  sessionKey?: string;
  text?: string;
  type: "chunk" | "done" | "session";
}

export const CHAT_HISTORY_PAGE_SIZE = 10;
export const WELCOME_MESSAGE_ID = "assistant-welcome";
export const WELCOME_MESSAGE: AssistantMessage = {
  content:
    "Hi there! Thanks for visiting my website. Feel free to ask me about my projects, experience, blogs, or even a general question.",
  id: WELCOME_MESSAGE_ID,
  role: "assistant"
};

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getBlogSlugFromPathname(pathname: string): string | undefined {
  const match = /^\/blog\/([^/?#]+)/.exec(pathname);
  return match?.[1];
}

export function isStreamEvent(value: unknown): value is StreamEvent {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  return value.type === "chunk" || value.type === "done" || value.type === "session";
}

export function isTransformResult(value: unknown): value is TransformResult {
  return (
    isRecord(value) &&
    typeof value.mode === "string" &&
    typeof value.title === "string" &&
    typeof value.transformedText === "string" &&
    Array.isArray(value.bullets)
  );
}

export function isAssistantMessage(value: unknown): value is AssistantMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.content === "string" &&
    (value.role === "assistant" || value.role === "user")
  );
}

export function isChatHistoryResponse(value: unknown): value is ChatHistoryResponse {
  return (
    isRecord(value) &&
    typeof value.hasMore === "boolean" &&
    typeof value.limit === "number" &&
    (typeof value.sessionKey === "string" || value.sessionKey === null) &&
    Array.isArray(value.messages) &&
    typeof value.offset === "number" &&
    typeof value.total === "number" &&
    value.messages.every(isAssistantMessage)
  );
}
