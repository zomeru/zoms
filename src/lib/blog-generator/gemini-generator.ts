import { GoogleGenAI } from "@google/genai";

import { MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH } from "@/constants";

import { getErrorMessage } from "../errorMessages";
import { log } from "../logger";
import { SYSTEM_INSTRUCTION } from "./constants";
import { generatePrompt, tryParseAIJSON } from "./helpers";
import type { GeneratedBlogDraft } from "./types";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required for blog generation");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate blog post content using Gemini AI
 */
export async function geminiGenerateBlogContent(): Promise<GeneratedBlogDraft> {
  const prompt = generatePrompt();

  const result = await getGeminiClient().models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        required: ["title", "slug", "excerpt", "tags", "content"],
        properties: {
          title: {
            type: "string",
            description: `SEO-optimized title, max ${MAX_TITLE_LENGTH} characters`
          },
          slug: {
            type: "string",
            description: "kebab-case SEO-friendly slug"
          },
          excerpt: {
            type: "string",
            description: `1-2 sentence SEO-friendly summary, max ${MAX_SUMMARY_LENGTH} characters`
          },
          tags: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: { type: "string" },
            description: "Relevant SEO keywords"
          },
          content: {
            type: "string",
            description:
              "Full production-ready markdown blog post with H1-H3 hierarchy, concise and practical, targeting about 900-1200 words"
          }
        }
      },
      candidateCount: 1,
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 8192,
      thinkingConfig: {
        thinkingBudget: 0
      }
    }
  });

  if (!result.text) {
    const finishReason = result.candidates?.[0]?.finishReason;
    log.error("Gemini returned no text", { finishReason, modelVersion: result.modelVersion });
    throw new Error(getErrorMessage("AI_GENERATION_FAILED"));
  }

  try {
    const parsed = tryParseAIJSON(result.text);
    const wordCount = parsed.content.split(/\s+/).filter(Boolean).length;

    if (wordCount < 700) {
      throw new Error(getErrorMessage("AI_GENERATION_TOO_SHORT"));
    }

    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      title: parsed.title.slice(0, MAX_TITLE_LENGTH),
      summary: parsed.excerpt.slice(0, MAX_SUMMARY_LENGTH),
      body: parsed.content,
      provider: "gemini",
      tags: parsed.tags.slice(0, 5),
      readTime,
      suggestedSlug: parsed.slug
    };
  } catch (error) {
    throw new Error(getErrorMessage("AI_GENERATION_FAILED"), { cause: error });
  }
}
