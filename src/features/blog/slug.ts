import type { SanityClient } from "@sanity/client";
import { fromThrowable, ok, type Result } from "@/lib/result";

export function normalizeBlogSlug(value: string): string {
  const MAX_SLUG_LENGTH = 80;
  const sanitizedSlug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (sanitizedSlug.length === 0) {
    return "generated-post";
  }

  if (sanitizedSlug.length <= MAX_SLUG_LENGTH) {
    return sanitizedSlug;
  }

  const truncatedSlug = sanitizedSlug.slice(0, MAX_SLUG_LENGTH).replace(/-[^-]*$/, "");

  return truncatedSlug.length > 0 ? truncatedSlug : sanitizedSlug.slice(0, MAX_SLUG_LENGTH);
}

export async function resolveUniqueBlogSlug(
  sanityClient: SanityClient,
  candidate: string
): Promise<string> {
  const result = await tryResolveUniqueBlogSlug(sanityClient, candidate);

  if (!result.ok) {
    throw result.error;
  }

  return result.data;
}

export async function tryResolveUniqueBlogSlug(
  sanityClient: SanityClient,
  candidate: string
): Promise<Result<string, unknown>> {
  const baseSlug = normalizeBlogSlug(candidate);
  const existingSlugsResult = await fromThrowable(async () =>
    sanityClient.fetch<string[]>(
      `*[_type == "blogPost" && slug.current match $slugPattern].slug.current`,
      {
        slugPattern: `${baseSlug}*`
      }
    )
  );

  if (!existingSlugsResult.ok) {
    return existingSlugsResult;
  }

  const existingSlugs = existingSlugsResult.data;
  const taken = new Set(existingSlugs);

  if (!taken.has(baseSlug)) {
    return ok(baseSlug);
  }

  let counter = 1;

  while (taken.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }

  return ok(`${baseSlug}-${counter}`);
}
