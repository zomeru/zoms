import type { QueryClassification } from './classify';
import type { RetrievedChunk } from './types';

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function calculateRecencyBoost(publishedAt?: string): number {
  if (!publishedAt) {
    return 0;
  }

  const published = new Date(publishedAt).getTime();
  const ageInDays = Math.max(0, (Date.now() - published) / (1000 * 60 * 60 * 24));
  const freshness = Math.max(0, 365 - ageInDays) / 365;

  return freshness * 0.15;
}

function calculateTitleBoost(title: string, exactQuery: string, queryTokens: string[]): number {
  let boost = 0;

  if (title === exactQuery || title.includes(exactQuery)) {
    boost += 0.45;
  }

  const matchingTitleTokens = queryTokens.filter(
    (token) => token.length > 2 && title.includes(token)
  );

  return boost + Math.min(matchingTitleTokens.length, 3) * 0.12;
}

function calculateSlugBoost(slug: string | undefined, exactQuery: string): number {
  if (!slug) {
    return 0;
  }

  if (slug === exactQuery || exactQuery.includes(slug)) {
    return 0.35;
  }

  return 0;
}

function calculateTagBoost(tags: string[], queryTokens: string[]): number {
  const matchingTags = tags.filter((tag) => queryTokens.some((token) => tag.includes(token)));
  return matchingTags.length * 0.1;
}

function calculateSectionBoost(sectionTitle: string, queryTokens: string[]): number {
  return queryTokens.some((token) => sectionTitle.includes(token)) ? 0.15 : 0;
}

function calculateContentTypeBoost(
  contentType: RetrievedChunk['contentType'],
  classification: QueryClassification
): number {
  const preferredContentType = classification.preferredContentTypes.includes(contentType);

  if (preferredContentType) {
    return classification.strictContentTypes ? 0.55 : 0.2;
  }

  return classification.strictContentTypes ? -0.45 : 0;
}

function calculateCurrentPageBoost(
  currentBlogSlug: string | undefined,
  slug: string | undefined
): number {
  return currentBlogSlug && slug === currentBlogSlug ? 0.25 : 0;
}

export function rankRetrievedChunks(input: {
  classification: QueryClassification;
  currentBlogSlug?: string;
  matches: RetrievedChunk[];
  query: string;
}): RetrievedChunk[] {
  const queryTokens =
    input.classification.tokens.length > 0 ? input.classification.tokens : tokenize(input.query);
  const exactQuery = input.query.trim().toLowerCase();

  return [...input.matches]
    .map((match) => {
      const title = match.title.toLowerCase();
      const slug = match.slug?.toLowerCase();
      const sectionTitle = match.sectionTitle.toLowerCase();
      const tags = match.tags.map((tag) => tag.toLowerCase());
      const score =
        match.score +
        calculateTitleBoost(title, exactQuery, queryTokens) +
        calculateSlugBoost(slug, exactQuery) +
        calculateTagBoost(tags, queryTokens) +
        calculateSectionBoost(sectionTitle, queryTokens) +
        calculateContentTypeBoost(match.contentType, input.classification) +
        calculateCurrentPageBoost(input.currentBlogSlug, match.slug) +
        calculateRecencyBoost(match.publishedAt);

      return {
        ...match,
        score
      };
    })
    .sort((left, right) => right.score - left.score);
}
