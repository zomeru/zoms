import log from "../logger";
import { geminiGenerateBlogContent } from "./gemini-generator";
import { openrouterGenerateBlogContent } from "./openrouter-generator";
import type { GeneratedBlogDraft } from "./types";

export type {
  BlogGenerationProvider,
  BlogGenerationTriggerMode,
  GeneratedBlogDraft
} from "./types";

export async function generateBlogContent(): Promise<GeneratedBlogDraft> {
  const provider = process.env.BLOG_GENERATION_PROVIDER ?? "gemini";

  log.info("Starting blog content generation with provider", { provider });

  if (provider === "openrouter") {
    return await openrouterGenerateBlogContent();
  }

  return await geminiGenerateBlogContent();
}
