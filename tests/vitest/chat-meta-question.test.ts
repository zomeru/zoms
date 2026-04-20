import { describe, expect, it } from "vitest";

import {
  CHAT_DEFAULT_HISTORY_LIMIT,
  CHAT_META_HISTORY_LIMIT,
  isChatMetaQuestion,
  resolveChatHistoryLimit
} from "@/lib/ai/chat/metaQuestion";

describe("isChatMetaQuestion", () => {
  it.each([
    "What did I ask earlier?",
    "what have we talked about",
    "summarize our conversation",
    "summarizing this chat please",
    "repeat my previous questions",
    "show my messages",
    "my history so far",
    "what was my earlier question",
    "recap our chat"
  ])("matches meta phrasing: %s", (question) => {
    expect(isChatMetaQuestion(question)).toBe(true);
  });

  it.each([
    "What is Zomer's latest project?",
    "Tell me about the blog on RAG.",
    "How does the vector pipeline work?",
    "Who built this site?",
    "List the experience entries.",
    ""
  ])("does not match non-meta phrasing: %s", (question) => {
    expect(isChatMetaQuestion(question)).toBe(false);
  });

  it("is case insensitive", () => {
    expect(isChatMetaQuestion("WHAT DID I ASK")).toBe(true);
    expect(isChatMetaQuestion("Summarize Our Conversation")).toBe(true);
  });
});

describe("resolveChatHistoryLimit", () => {
  it("returns meta limit for meta questions", () => {
    expect(resolveChatHistoryLimit("what did I ask")).toBe(CHAT_META_HISTORY_LIMIT);
  });

  it("returns default limit for normal questions", () => {
    expect(resolveChatHistoryLimit("tell me about the latest blog post")).toBe(
      CHAT_DEFAULT_HISTORY_LIMIT
    );
  });
});
