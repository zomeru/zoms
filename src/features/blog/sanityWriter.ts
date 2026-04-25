import { createClient, type SanityClient } from "@sanity/client";

import type { BlogGenerationTriggerMode, GeneratedBlogDraft } from "@/lib/blog-generator";
import { ApiError } from "@/lib/errorHandler";
import { getErrorMessage } from "@/lib/errorMessages";
import log from "@/lib/logger";
import { err, ok, type Result } from "@/lib/result";

import { resolveUniqueBlogSlug } from "./slug";

type SanityEnv = {
  apiToken: string;
  dataset: string;
  projectId: string;
};

function validateSanityEnv(logLabel: string): Result<SanityEnv, ApiError> {
  const apiToken = process.env.SANITY_API_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!apiToken || !projectId || !dataset) {
    log.error(`Sanity environment variables missing${logLabel ? ` (${logLabel})` : ""}`, {
      hasApiToken: !!apiToken,
      hasProjectId: !!projectId,
      hasDataset: !!dataset
    });
    return err(new ApiError(getErrorMessage("MISSING_SANITY_CONFIG"), 500, "CONFIG_ERROR"));
  }

  return ok({ apiToken, projectId, dataset });
}

export function createSanityWriteClient(logLabel = ""): SanityClient {
  const sanityEnvResult = validateSanityEnv(logLabel);

  if (!sanityEnvResult.ok) {
    throw sanityEnvResult.error;
  }

  const { apiToken, projectId, dataset } = sanityEnvResult.data;

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
