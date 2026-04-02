import { describe, expect, it } from "vitest";

import { buildGeneralAnswerPrompt, buildGroundedAnswerPrompt } from "@/lib/ai/prompts";

describe("AI prompts", () => {
  it("frames the assistant as an AI version of Zomer while keeping answers grounded", () => {
    const prompt = buildGroundedAnswerPrompt({
      citations: [],
      classification: "GENERAL_PORTFOLIO_QUERY",
      conversationHistory: [],
      query: "What did you work on at Evelan?",
      retrievedContext: "Experience context"
    });

    expect(prompt).toContain("You are Zomer");
    expect(prompt).toContain("Answer using only the retrieved context from the site.");
    expect(prompt).toContain("Use first person");
    expect(prompt).toContain("use markdown links");
    expect(prompt).toContain("[link text](/blog/example-post)");
    expect(prompt).toContain("Do not output bare site paths by themselves");
  });

  it("allows fenced code blocks for code examples in grounded answers", () => {
    const prompt = buildGroundedAnswerPrompt({
      citations: [],
      classification: "GENERAL_PORTFOLIO_QUERY",
      conversationHistory: [],
      query: "Show me some TypeScript code",
      retrievedContext: "TypeScript context"
    });

    expect(prompt).toContain("CODE BLOCK RULES (CRITICAL");
    expect(prompt).toContain("- Only wrap actual code in fenced markdown blocks.");
    expect(prompt).toContain("Every code block MUST start with ```<language>");
    expect(prompt).toContain("for example ```ts, ```tsx, ```js, ```json, ```bash");
    expect(prompt).toContain("Ensure markdown remains valid even when the response is streamed.");
  });

  it("allows fenced code blocks for code examples in general answers", () => {
    const prompt = buildGeneralAnswerPrompt({
      conversationHistory: [],
      query: "Show me some TypeScript code",
      relatedBlogContext: ""
    });

    expect(prompt).toContain("CODE BLOCK RULES (CRITICAL");
    expect(prompt).toContain("- Only wrap actual code in fenced markdown blocks.");
    expect(prompt).toContain("Every code block MUST start with (3 backticks + language)");
    expect(prompt).toContain("for example ```ts, ```tsx, ```js, ```json, ```bash");
    expect(prompt).toContain("Every code block MUST end with ``` (3 backticks) on its own line.");
    expect(prompt).toContain("use markdown links");
    expect(prompt).toContain("[link text](/blog/example-post)");
  });
});
