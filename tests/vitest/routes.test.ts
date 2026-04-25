import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QueryClassification } from "@/lib/retrieval/classify";

const checkBotId = vi.fn();
interface RetrievalCallInput {
  query: string;
}

interface GroundedAnswerCallInput {
  conversationHistory: Array<{
    content: string;
    role: "assistant" | "user";
  }>;
  memoryContext?: string;
}

interface GeneralAnswerCallInput {
  relatedBlogChunks?: unknown[];
}

function isRetrievalCallInput(value: unknown): value is RetrievalCallInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "query" in value &&
    typeof value.query === "string"
  );
}

function isGroundedAnswerCallInput(value: unknown): value is GroundedAnswerCallInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "conversationHistory" in value &&
    Array.isArray(value.conversationHistory)
  );
}

function isGeneralAnswerCallInput(value: unknown): value is GeneralAnswerCallInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("relatedBlogChunks" in value)) {
    return true;
  }

  return Array.isArray(value.relatedBlogChunks);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStreamEvents(body: string): Array<Record<string, unknown>> {
  return body
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const payload: unknown = JSON.parse(line);

      return isRecord(payload) ? [payload] : [];
    });
}

const rateLimitMiddleware = vi.fn();
const repositories = {
  createAssistantReplyWithRetrievalEvent: vi.fn(),
  createUserTurn: vi.fn(),
  getChatHistoryPage: vi.fn(),
  getRecentChatMessages: vi.fn(),
  getChatSession: vi.fn()
};
const retrieveRelevantChunks = vi.fn();
const retrieveBlogs = retrieveRelevantChunks;
const retrieveExperience = retrieveRelevantChunks;
const retrievePortfolio = retrieveRelevantChunks;
const retrieveProjects = retrieveRelevantChunks;
const getDirectAssistantAnswer = vi.fn();
const streamGeneralAnswer = vi.fn();
const streamGroundedAnswer = vi.fn();
const generateBlogTransform = vi.fn();
const runSiteReindex = vi.fn();
const withQueryCache = vi.fn();
const getBlogPostBySlug = vi.fn();
const isAuthorizedAiReindexRequest = vi.fn();
const getAiReindexSessionCookie = vi.fn();
const searchSessionMemory = vi.fn();
const storeSessionMemory = vi.fn();
const log = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

vi.mock("botid/server", () => ({
  checkBotId
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimitMiddleware
}));

vi.mock("@/lib/db/repositories", () => ({
  repositories
}));

vi.mock("@/lib/retrieval/search", () => ({
  retrieveBlogs,
  retrieveExperience,
  retrievePortfolio,
  retrieveProjects,
  retrieveRelevantChunks
}));

vi.mock("@/lib/ai/directAnswers", () => ({
  getDirectAssistantAnswer
}));

vi.mock("@/lib/ai/chat-stream", () => ({
  streamGeneralAnswer,
  streamGroundedAnswer
}));

vi.mock("@/lib/ai/transform", () => ({
  generateBlogTransform
}));

vi.mock("@/lib/ingestion/reindex", () => ({
  runSiteReindex
}));

vi.mock("@/lib/cache/queryCache", () => ({
  withQueryCache
}));

vi.mock("@/lib/blog", () => ({
  getBlogPostBySlug
}));

vi.mock("@/lib/ai/memory", () => ({
  searchSessionMemory,
  storeSessionMemory
}));

vi.mock("@/lib/ai/reindexAuth", () => ({
  getAiReindexSessionCookie,
  isAuthorizedAiReindexRequest
}));

vi.mock("@/lib/logger", () => ({
  default: log
}));

describe("AI routes", () => {
  beforeEach(() => {
    const defaultClassification: QueryClassification = {
      intent: "GENERAL_KNOWLEDGE_QUERY",
      preferredContentTypes: ["about", "experience", "project", "blog"],
      query: "How does the assistant stay grounded?",
      strictContentTypes: false,
      tokens: ["how", "does", "the", "assistant", "stay", "grounded"]
    };
    rateLimitMiddleware.mockResolvedValue(null);
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: false,
      isHuman: true,
      isVerifiedBot: false
    });
    repositories.createUserTurn.mockResolvedValue({
      sessionId: "session-db-id",
      userMessageId: "message-id"
    });
    repositories.createAssistantReplyWithRetrievalEvent.mockResolvedValue({ id: "retrieval-id" });
    repositories.getChatHistoryPage.mockResolvedValue({
      hasMore: false,
      messages: [],
      total: 0
    });
    repositories.getRecentChatMessages.mockResolvedValue([]);
    repositories.getChatSession.mockResolvedValue({
      id: "session-db-id",
      sessionKey: "00000000-0000-0000-0000-000000000001"
    });
    retrieveRelevantChunks.mockResolvedValue({
      citations: [
        {
          contentType: "blog",
          id: "citation-1",
          sectionTitle: "Summary",
          snippet: "deterministic retrieval",
          title: "Grounded assistant",
          url: "/blog/grounded-assistant"
        }
      ],
      classification: defaultClassification,
      matches: [],
      shouldRefuse: false
    });
    getDirectAssistantAnswer.mockResolvedValue(null);
    streamGroundedAnswer.mockResolvedValue({
      citations: [
        {
          contentType: "blog",
          id: "citation-1",
          sectionTitle: "Summary",
          snippet: "deterministic retrieval",
          title: "Grounded assistant",
          url: "/blog/grounded-assistant"
        }
      ],
      supported: true,
      textStream: (async function* () {
        yield "Grounded ";
        yield "response text.";
      })()
    });
    streamGeneralAnswer.mockResolvedValue({
      citations: [],
      supported: true,
      textStream: (async function* () {
        yield "Rust is ";
        yield "a systems programming language.";
      })()
    });
    generateBlogTransform.mockResolvedValue({
      bullets: ["Short summary"],
      mode: "tldr",
      title: "TL;DR",
      transformedText: "Short transform text."
    });
    withQueryCache.mockImplementation(
      async (_key: string, loader: () => Promise<unknown>) => await loader()
    );
    getBlogPostBySlug.mockResolvedValue({
      body: "# Post body",
      slug: { current: "grounded-assistant" },
      summary: "Summary",
      title: "Grounded assistant"
    });
    searchSessionMemory.mockResolvedValue([]);
    storeSessionMemory.mockResolvedValue(undefined);
    isAuthorizedAiReindexRequest.mockReturnValue(true);
    getAiReindexSessionCookie.mockReturnValue({
      name: "ai_reindex_session",
      options: {
        httpOnly: true,
        path: "/",
        sameSite: "lax"
      },
      value: "signed"
    });
    runSiteReindex.mockResolvedValue({
      processed: 3,
      runId: "run-id",
      skipped: 1,
      updated: 2
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not persist no-result analytics when the assistant cannot support an answer", async () => {
    const { POST } = await import("@/app/api/ai/chat/route");
    retrieveRelevantChunks.mockResolvedValueOnce({
      citations: [],
      classification: {
        intent: "EXPERIENCE_QUERY",
        preferredContentTypes: ["experience"],
        query: "What did Zomer do at unknown company?",
        strictContentTypes: true,
        tokens: ["what", "did", "zomer", "do", "at", "unknown", "company"]
      },
      matches: [],
      shouldRefuse: true
    });
    streamGroundedAnswer.mockResolvedValueOnce({
      citations: [],
      supported: false,
      textStream: (async function* () {
        yield "I can only answer from content that is currently indexed on this site.";
      })()
    });

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          question: "What did Zomer do at unknown company?"
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain("indexed on this site");
    expect("createNoResultEvent" in repositories).toBe(false);
  });

  it("creates a chat session, validates the request, and streams a grounded answer", async () => {
    const { POST } = await import("@/app/api/ai/chat/route");
    retrieveRelevantChunks.mockResolvedValueOnce({
      citations: [
        {
          contentType: "blog",
          id: "citation-1",
          sectionTitle: "Summary",
          snippet: "deterministic retrieval",
          title: "Grounded assistant",
          url: "/blog/grounded-assistant"
        }
      ],
      classification: {
        intent: "BLOG_QUERY",
        preferredContentTypes: ["blog"],
        query: "What does the blog post say about grounded retrieval?",
        strictContentTypes: true,
        tokens: ["what", "does", "the", "blog", "post", "say", "about", "grounded", "retrieval"]
      },
      matches: [],
      shouldRefuse: false
    });

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          blogSlug: "grounded-assistant",
          pathname: "/blog/grounded-assistant",
          question: "What does the blog post say about grounded retrieval?"
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(repositories.createUserTurn).toHaveBeenCalledTimes(1);
    expect(response.headers.get("set-cookie")).toContain("ai_chat_session=");

    const body = await response.text();
    expect(body).toContain('"type":"chunk"');
    expect(body).toContain("Grounded response text.");
    expect(body).toContain('"text":"Grounded "');
    expect(body).toContain('"text":"response text."');
    expect(body).not.toContain('"type":"session"');
  });

  it("uses recent session messages as memory and exposes history for reload hydration", async () => {
    searchSessionMemory.mockResolvedValueOnce([
      "Previous discussion summary: Batibot is an AI-powered messaging companion project."
    ]);
    repositories.getChatHistoryPage.mockResolvedValueOnce({
      hasMore: false,
      messages: [
        {
          citations: null,
          content: "Tell me about Batibot.",
          groundedAnswer: null,
          id: "user-1",
          role: "USER"
        },
        {
          citations: [],
          content: "Batibot is an AI-powered messaging companion.",
          groundedAnswer: {
            supported: true
          },
          id: "assistant-1",
          role: "ASSISTANT"
        }
      ],
      total: 2
    });
    const historyMessages = [
      {
        citations: null,
        content: "Tell me about Batibot.",
        groundedAnswer: null,
        id: "user-1",
        role: "USER" as const
      },
      {
        citations: [],
        content: "Batibot is an AI-powered messaging companion.",
        groundedAnswer: {
          supported: true
        },
        id: "assistant-1",
        role: "ASSISTANT" as const
      }
    ];
    repositories.getRecentChatMessages.mockResolvedValueOnce(historyMessages);
    repositories.getChatHistoryPage.mockResolvedValueOnce({
      hasMore: false,
      messages: historyMessages,
      total: 2
    });

    const { GET, POST } = await import("@/app/api/ai/chat/route");

    const historyResponse = await GET(
      new NextRequest("http://localhost/api/ai/chat", {
        headers: {
          cookie: "ai_chat_session=00000000-0000-0000-0000-000000000001"
        }
      })
    );

    expect(historyResponse.status).toBe(200);
    expect(await historyResponse.json()).toEqual({
      hasMore: false,
      limit: 10,
      messages: [
        {
          content: "Tell me about Batibot.",
          id: "user-1",
          role: "user"
        },
        {
          citations: [],
          content: "Batibot is an AI-powered messaging companion.",
          id: "assistant-1",
          messageId: "assistant-1",
          role: "assistant",
          supported: true
        }
      ],
      offset: 0,
      sessionKey: null,
      total: 2
    });

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          question: "What stack did it use?"
        }),
        headers: {
          cookie: "ai_chat_session=00000000-0000-0000-0000-000000000001"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    const retrievalInput: unknown = retrieveRelevantChunks.mock.calls[0]?.[0];
    const groundedAnswerInput: unknown = streamGroundedAnswer.mock.calls[0]?.[0];

    expect(isRetrievalCallInput(retrievalInput)).toBe(true);
    expect(isGroundedAnswerCallInput(groundedAnswerInput)).toBe(true);

    if (!isRetrievalCallInput(retrievalInput) || !isGroundedAnswerCallInput(groundedAnswerInput)) {
      throw new Error("Expected retrieval and grounded answer calls to receive structured input.");
    }

    expect(retrievalInput.query).toContain("Tell me about Batibot.");
    expect(groundedAnswerInput.conversationHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: "Tell me about Batibot.",
          role: "user"
        })
      ])
    );
    expect(groundedAnswerInput.memoryContext).toContain("Batibot is an AI-powered messaging");
    expect(searchSessionMemory).toHaveBeenCalledWith({
      limit: 3,
      query: "What stack did it use?",
      sessionKey: "00000000-0000-0000-0000-000000000001"
    });
    expect(repositories.getChatSession).not.toHaveBeenCalled();
    expect(repositories.getRecentChatMessages).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      12
    );
  });

  it("expands chat history window when the user asks a chat-meta question", async () => {
    const { POST } = await import("@/app/api/ai/chat/route");

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          question: "summarize our conversation so far"
        }),
        headers: {
          cookie: "ai_chat_session=00000000-0000-0000-0000-000000000001"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(repositories.getRecentChatMessages).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      50
    );
  });

  it("ignores leaked session keys in the query string and only trusts the chat cookie", async () => {
    const { GET } = await import("@/app/api/ai/chat/route");

    const response = await GET(
      new NextRequest("http://localhost/api/ai/chat?sessionKey=leaked-value", {
        headers: {
          cookie: "ai_chat_session=trusted-cookie"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(repositories.getChatHistoryPage).toHaveBeenCalledWith("trusted-cookie", {
      limit: 10,
      offset: 0
    });
  });

  it("answers broad general-knowledge questions without site retrieval", async () => {
    const { POST } = await import("@/app/api/ai/chat/route");

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          question: "What are popular JavaScript frameworks right now?"
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(retrieveRelevantChunks).not.toHaveBeenCalled();
    expect(searchSessionMemory).not.toHaveBeenCalled();
    expect(streamGeneralAnswer).toHaveBeenCalledTimes(1);

    const generalAnswerInput: unknown = streamGeneralAnswer.mock.calls[0]?.[0];

    expect(isGeneralAnswerCallInput(generalAnswerInput)).toBe(true);

    if (!isGeneralAnswerCallInput(generalAnswerInput)) {
      throw new TypeError("Expected streamGeneralAnswer to receive a general answer input");
    }

    expect(generalAnswerInput.relatedBlogChunks).toEqual([]);
  });

  it("falls back cleanly when session memory lookup fails", async () => {
    searchSessionMemory.mockRejectedValueOnce(new Error("memory unavailable"));
    repositories.getRecentChatMessages.mockResolvedValueOnce([
      {
        citations: null,
        content: "Tell me about Batibot.",
        groundedAnswer: null,
        id: "user-1",
        role: "USER"
      }
    ]);

    const { POST } = await import("@/app/api/ai/chat/route");

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          question: "What stack did it use?"
        }),
        headers: {
          cookie: "ai_chat_session=00000000-0000-0000-0000-000000000001"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain('"type":"done"');
  });

  it("falls back cleanly when session memory storage fails", async () => {
    storeSessionMemory.mockRejectedValueOnce(new Error("store unavailable"));

    const { POST } = await import("@/app/api/ai/chat/route");

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          question: "What are popular JavaScript frameworks right now?"
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain('"type":"done"');
  });

  it("streams grounded answer chunks and includes messageId in done event", async () => {
    repositories.createAssistantReplyWithRetrievalEvent.mockResolvedValueOnce({
      id: "assistant-message-id"
    });

    const { POST } = await import("@/app/api/ai/chat/route");

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          blogSlug: "grounded-assistant",
          pathname: "/blog/grounded-assistant",
          question: "What does the blog post say about grounded retrieval?"
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(200);

    const events = parseStreamEvents(await response.text());
    const doneEvent = events.at(-1);

    expect(doneEvent).toMatchObject({
      answer: {
        answer: "Grounded response text.",
        citations: [
          expect.objectContaining({
            id: "citation-1"
          })
        ],
        supported: true
      },
      messageId: "assistant-message-id",
      type: "done"
    });
  });

  it("streams answer text even when atomic db write fails after streaming", async () => {
    repositories.createAssistantReplyWithRetrievalEvent.mockRejectedValueOnce(
      new Error("db unavailable")
    );

    const { POST } = await import("@/app/api/ai/chat/route");

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          blogSlug: "grounded-assistant",
          pathname: "/blog/grounded-assistant",
          question: "What does the blog post say about grounded retrieval?"
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(200);

    const events = parseStreamEvents(await response.text());
    const doneEvent = events.at(-1);

    expect(doneEvent).toMatchObject({
      answer: expect.objectContaining({ answer: "Grounded response text." }),
      type: "done"
    });
    expect(doneEvent).not.toHaveProperty("messageId");
  });

  it("sets a secure chat cookie for new sessions in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    try {
      const { POST } = await import("@/app/api/ai/chat/route");

      const response = await POST(
        new NextRequest("http://localhost/api/ai/chat", {
          body: JSON.stringify({
            question: "Tell me about grounded retrieval"
          }),
          method: "POST"
        })
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain("Secure");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("returns a rate-limited response when the limiter blocks chat requests", async () => {
    const { NextResponse } = await import("next/server");
    const { POST } = await import("@/app/api/ai/chat/route");

    rateLimitMiddleware.mockResolvedValueOnce(
      NextResponse.json({ code: "RATE_LIMIT_EXCEEDED" }, { status: 429 })
    );

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({ question: "Blocked" }),
        method: "POST"
      })
    );

    expect(response.status).toBe(429);
  });

  it("validates transform requests and returns grounded transforms", async () => {
    const { POST } = await import("@/app/api/ai/transform/route");

    const invalidResponse = await POST(
      new NextRequest("http://localhost/api/ai/transform", {
        body: JSON.stringify({
          mode: "invalid",
          postSlug: "grounded-assistant"
        }),
        method: "POST"
      })
    );

    expect(invalidResponse.status).toBe(400);
    expect(log.error).toHaveBeenCalledWith(
      "API Error",
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        path: "/api/ai/transform",
        statusCode: 400
      })
    );

    const validResponse = await POST(
      new NextRequest("http://localhost/api/ai/transform", {
        body: JSON.stringify({
          mode: "tldr",
          postSlug: "grounded-assistant"
        }),
        method: "POST"
      })
    );

    expect(validResponse.status).toBe(200);
    expect(generateBlogTransform).toHaveBeenCalledTimes(1);
  });

  it("rejects unauthorized reindex requests and accepts authorized ones", async () => {
    const { POST } = await import("@/app/api/ai/reindex/route");

    isAuthorizedAiReindexRequest.mockReturnValueOnce(false);

    const unauthorized = await POST(
      new NextRequest("http://localhost/api/ai/reindex", {
        body: JSON.stringify({}),
        method: "POST"
      })
    );

    expect(unauthorized.status).toBe(401);

    const authorized = await POST(
      new NextRequest("http://localhost/api/ai/reindex", {
        body: JSON.stringify({ documentId: "blog:grounded-assistant" }),
        headers: {
          authorization: "Bearer secret"
        },
        method: "POST"
      })
    );

    expect(authorized.status).toBe(200);
    expect(runSiteReindex).toHaveBeenCalledWith({ documentId: "blog:grounded-assistant" });
  });
});
