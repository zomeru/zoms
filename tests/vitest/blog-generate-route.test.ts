import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkBotId = vi.fn();
const rateLimitMiddleware = vi.fn();
const generateBlogContent = vi.fn();
const sanityCreate = vi.fn();
const sanityFetch = vi.fn();
const createSanityClient = vi.fn();
const scheduleBlogReindex = vi.fn();
const revalidatePath = vi.fn();
const log = {
  error: vi.fn(),
  info: vi.fn(),
  request: vi.fn(),
  response: vi.fn(),
  timeAsync: vi.fn(async <T>(_label: string, fn: () => Promise<T>) => await fn()),
  warn: vi.fn()
};

vi.mock("@/lib/rateLimit", () => ({
  rateLimitMiddleware
}));

vi.mock("@/lib/blog-generator", () => ({
  generateBlogContent
}));

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("@sanity/client", () => ({
  createClient: createSanityClient
}));

vi.mock("@/lib/blogReindex", () => ({
  scheduleBlogReindex
}));

vi.mock("@/lib/logger", () => ({
  default: log
}));

vi.mock("botid/server", () => ({
  checkBotId
}));

describe("blog generation route", () => {
  beforeEach(() => {
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: false,
      isHuman: true,
      isVerifiedBot: false
    });
    rateLimitMiddleware.mockResolvedValue(null);
    generateBlogContent.mockResolvedValue({
      body: "# Post body",
      provider: "gemini",
      readTime: 5,
      suggestedSlug: "generated-blog-post",
      summary: "Generated summary",
      tags: ["AI", "Next.js"],
      title: "Generated Blog Post"
    });
    sanityCreate.mockResolvedValue({
      _id: "sanity-post-id",
      generated: true,
      publishedAt: "2026-03-23T00:00:00.000Z",
      readTime: 5,
      slug: { current: "generated-blog-post" },
      tags: ["AI", "Next.js"],
      title: "Generated Blog Post"
    });
    createSanityClient.mockReturnValue({
      create: sanityCreate,
      fetch: sanityFetch
    });
    sanityFetch.mockResolvedValue([]);
    process.env.CRON_SECRET = "cron-secret";
    process.env.SANITY_API_TOKEN = "sanity-token";
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "project-id";
    process.env.NEXT_PUBLIC_SANITY_DATASET = "dataset";
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.SANITY_API_TOKEN;
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_SANITY_DATASET;
  });

  it("rejects unverified bots before processing the request", async () => {
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: true,
      isHuman: false,
      isVerifiedBot: false
    });

    const { POST } = await import("@/app/api/blog/generate/route");

    const response = await POST(
      new NextRequest("http://localhost/api/blog/generate", {
        body: JSON.stringify({ aiGenerated: true }),
        method: "POST"
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: "Bot detected. Access denied."
    });
    expect(generateBlogContent).not.toHaveBeenCalled();
  });

  it("marks manual runs as AI-generated, revalidates blog surfaces, and schedules a targeted reindex", async () => {
    const { POST } = await import("@/app/api/blog/generate/route");

    const response = await POST(
      new NextRequest("http://localhost/api/blog/generate", {
        body: JSON.stringify({ aiGenerated: true }),
        headers: {
          authorization: "Bearer cron-secret"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      post: {
        generated: true,
        slug: {
          current: "generated-blog-post"
        },
        title: "Generated Blog Post"
      },
      success: true
    });
    expect(sanityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        generated: true,
        slug: {
          _type: "slug",
          current: "generated-blog-post"
        },
        source: "manual/gemini"
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/blog");
    expect(revalidatePath).toHaveBeenCalledWith("/blog/generated-blog-post");
    expect(scheduleBlogReindex).toHaveBeenCalledWith("generated-blog-post");
  });

  it("resolves slug conflicts before creating the new post", async () => {
    sanityFetch.mockResolvedValueOnce(["generated-blog-post", "generated-blog-post-1"]);

    const { POST } = await import("@/app/api/blog/generate/route");

    const response = await POST(
      new NextRequest("http://localhost/api/blog/generate", {
        body: JSON.stringify({ triggerMode: "manual" }),
        headers: {
          authorization: "Bearer cron-secret"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(sanityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: {
          _type: "slug",
          current: "generated-blog-post-2"
        }
      })
    );
  });
});
