import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const checkBotId = vi.fn();
const rateLimitMiddleware = vi.fn();
const repositories = {
  createAssistantReplyWithRetrievalEvent: vi.fn(),
  createUserTurn: vi.fn()
};
const getDirectAssistantAnswer = vi.fn();
const streamGeneralAnswer = vi.fn();
const streamGroundedAnswer = vi.fn();

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
  retrieveBlogs: vi.fn(),
  retrieveExperience: vi.fn(),
  retrievePortfolio: vi.fn(),
  retrieveProjects: vi.fn()
}));

vi.mock("@/lib/ai/directAnswers", () => ({
  getDirectAssistantAnswer
}));

vi.mock("@/lib/ai/chat-stream", () => ({
  streamGeneralAnswer,
  streamGroundedAnswer
}));

vi.mock("@/lib/vector/index", () => ({
  getVectorIndexClient: () => ({
    query: vi.fn()
  })
}));

describe("direct answer chat route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: false,
      isHuman: true,
      isVerifiedBot: false
    });
    rateLimitMiddleware.mockResolvedValue(null);
    repositories.createUserTurn.mockResolvedValue({
      sessionId: "session-db-id",
      userMessageId: "message-id"
    });
    repositories.createAssistantReplyWithRetrievalEvent.mockResolvedValue({ id: "retrieval-id" });
    getDirectAssistantAnswer.mockResolvedValue({
      citations: [
        {
          contentType: "blog",
          id: "direct:blog:latest",
          sectionTitle: "Summary",
          snippet:
            "Optimizing Node.js 24.x Streams: High-Performance Data Processing with Web Streams and Backpressure",
          title:
            "Optimizing Node.js 24.x Streams: High-Performance Data Processing with Web Streams and Backpressure",
          url: "/blog/node-streams"
        }
      ],
      supported: true,
      textStream: (async function* () {
        yield "The latest blog post is ";
        yield '"Optimizing Node.js 24.x Streams: High-Performance Data Processing with Web Streams and Backpressure".';
      })()
    });
  });

  it("answers latest blog queries through the deterministic direct-answer path", async () => {
    const { POST } = await import("@/app/api/ai/chat/route");

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          question: "What is the latest blog?"
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(getDirectAssistantAnswer).toHaveBeenCalledTimes(1);
    expect(streamGroundedAnswer).not.toHaveBeenCalled();
    expect(streamGeneralAnswer).not.toHaveBeenCalled();

    const body = await response.text();
    expect(body).toContain("The latest blog post is");
    expect(body).toContain("Optimizing Node.js 24.x Streams");
  });

  it("streams multiple latest blog entries when the user asks for more than one", async () => {
    getDirectAssistantAnswer.mockResolvedValueOnce({
      citations: [
        {
          contentType: "blog",
          id: "direct:blog:latest:1",
          sectionTitle: "Summary",
          snippet: "Blog One",
          title: "Blog One",
          url: "/blog/one"
        },
        {
          contentType: "blog",
          id: "direct:blog:latest:2",
          sectionTitle: "Summary",
          snippet: "Blog Two",
          title: "Blog Two",
          url: "/blog/two"
        },
        {
          contentType: "blog",
          id: "direct:blog:latest:3",
          sectionTitle: "Summary",
          snippet: "Blog Three",
          title: "Blog Three",
          url: "/blog/three"
        }
      ],
      supported: true,
      textStream: (async function* () {
        yield "1. Blog One\n";
        yield "2. Blog Two\n";
        yield "3. Blog Three";
      })()
    });

    const { POST } = await import("@/app/api/ai/chat/route");

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        body: JSON.stringify({
          question: "Show me the latest 3 blogs"
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).toContain("1. Blog One");
    expect(body).toContain("2. Blog Two");
    expect(body).toContain("3. Blog Three");
  });
});
