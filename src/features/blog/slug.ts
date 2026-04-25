import type { SanityClient } from "@sanity/client";

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
  const baseSlug = normalizeBlogSlug(candidate);
  const existingSlugs = await sanityClient.fetch<string[]>(
    `*[_type == "blogPost" && slug.current match $slugPattern].slug.current`,
    {
      slugPattern: `${baseSlug}*`
    }
  );
  const taken = new Set(existingSlugs);

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;

  while (taken.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }

  return `${baseSlug}-${counter}`;
}
