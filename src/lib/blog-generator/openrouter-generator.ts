import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

import { MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH } from "@/constants";

import { getErrorMessage } from "../errorMessages";
import { SYSTEM_INSTRUCTION } from "./constants";
import { formatLLMText, generatePrompt, tryParseAIJSON } from "./helpers";
import type { GeneratedBlogDraft } from "./types";

function getOpenRouterProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required for blog generation");
  }

  return createOpenRouter({ apiKey });
}

export async function openrouterGenerateBlogContent(): Promise<GeneratedBlogDraft> {
  const model = process.env.OPENROUTER_BLOG_MODEL ?? "openrouter/free";

  if (!model) {
    throw new Error("OPENROUTER_BLOG_MODEL environment variable is required for blog generation");
  }
  const prompt = generatePrompt();
  const provider = getOpenRouterProvider();

  try {
    const result = await generateText({
      model: provider.chat(model),
      system: SYSTEM_INSTRUCTION,
      prompt
    });

    if (!result.text) {
      throw new Error(`No text generated. Finish reason: ${result.finishReason}`);
    }

    const parsed = tryParseAIJSON(result.text);
    const wordCount = parsed.content.split(/\s+/).filter(Boolean).length;

    if (wordCount < 700) {
      throw new Error(getErrorMessage("AI_GENERATION_TOO_SHORT"));
    }

    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      title: parsed.title.slice(0, MAX_TITLE_LENGTH),
      summary: parsed.excerpt.slice(0, MAX_SUMMARY_LENGTH),
      body: formatLLMText(parsed.content),
      provider: "openrouter",
      tags: parsed.tags.slice(0, 5),
      readTime,
      suggestedSlug: parsed.slug
    };
  } catch (error) {
    throw new Error(getErrorMessage("AI_GENERATION_FAILED"), { cause: error });
  }
}
