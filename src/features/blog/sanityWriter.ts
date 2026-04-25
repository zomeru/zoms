import { createClient, type SanityClient } from "@sanity/client";

import type { BlogGenerationTriggerMode, GeneratedBlogDraft } from "@/lib/blog-generator";
import { ApiError } from "@/lib/errorHandler";
import { getErrorMessage } from "@/lib/errorMessages";
import log from "@/lib/logger";

import { resolveUniqueBlogSlug } from "./slug";

function validateSanityEnv(logLabel: string) {
  const apiToken = process.env.SANITY_API_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!apiToken || !projectId || !dataset) {
    log.error(`Sanity environment variables missing${logLabel ? ` (${logLabel})` : ""}`, {
      hasApiToken: !!apiToken,
      hasProjectId: !!projectId,
      hasDataset: !!dataset
    });
    throw new ApiError(getErrorMessage("MISSING_SANITY_CONFIG"), 500, "CONFIG_ERROR");
  }

  return { apiToken, projectId, dataset };
}

export function createSanityWriteClient(logLabel = ""): SanityClient {
  const { apiToken, projectId, dataset } = validateSanityEnv(logLabel);

  return createClient({
    apiVersion: "2026-03-31",
    dataset,
    projectId,
    token: apiToken,
    useCdn: false
  });
}

export async function createBlogPost(
  sanityClient: SanityClient,
  content: GeneratedBlogDraft,
  triggerMode: BlogGenerationTriggerMode
) {
  const slug = await resolveUniqueBlogSlug(sanityClient, content.suggestedSlug || content.title);
  const sourceTrigger = triggerMode === "scheduled" ? "automated" : "manual";

  return await sanityClient.create({
    _type: "blogPost",
    title: content.title,
    slug: { _type: "slug", current: slug },
    summary: content.summary,
    body: content.body,
    publishedAt: new Date().toISOString(),
    tags: content.tags,
    source: `${sourceTrigger}/${content.provider}`,
    generated: true,
    readTime: content.readTime
  });
}
