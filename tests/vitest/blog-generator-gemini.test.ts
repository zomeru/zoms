import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  }
}));

import { geminiGenerateBlogContent } from "@/lib/blog-generator/gemini-generator";

describe("Gemini blog generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
    vi.stubEnv("GEMINI_MODEL", "test-thinking-model");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lets the configured model use its supported default thinking behavior", async () => {
    const content = Array.from({ length: 700 }, () => "word").join(" ");
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        title: "A Natural Technical Blog Title",
        slug: "a-natural-technical-blog-title",
        excerpt: "A focused technical article.",
        tags: ["typescript", "architecture", "testing"],
        content
      })
    });

    await geminiGenerateBlogContent();

    expect(generateContent).toHaveBeenCalledOnce();
    expect(generateContent.mock.calls[0]?.[0].config).not.toHaveProperty("thinkingConfig");
  });
});
