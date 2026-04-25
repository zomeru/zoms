import type { QueryClassification } from "./classify";
import { SCORING } from "./scoring";
import type { RetrievedChunk } from "./types";

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
  const freshness =
    Math.max(0, SCORING.RECENCY_WINDOW_DAYS - ageInDays) / SCORING.RECENCY_WINDOW_DAYS;

  return freshness * SCORING.RECENCY_BOOST_MAX;
}

function calculateExperienceOrderBoost(
  contentType: RetrievedChunk["contentType"],
  orderIndex: number | undefined
): number {
  if (contentType !== "experience" || orderIndex === undefined || orderIndex < 0) {
    return 0;
  }
  const normalized =
    Math.min(orderIndex, SCORING.EXPERIENCE_ORDER_CAP) / SCORING.EXPERIENCE_ORDER_CAP;
  return normalized * SCORING.EXPERIENCE_ORDER_BOOST_MAX;
}

function calculateTitleBoost(title: string, exactQuery: string, queryTokens: string[]): number {
  let boost = 0;

  if (title === exactQuery || title.includes(exactQuery)) {
    boost += SCORING.TITLE_EXACT_BOOST;
  }

  const matchingTitleTokens = queryTokens.filter(
    (token) => token.length > 2 && title.includes(token)
  );

  return (
    boost +
    Math.min(matchingTitleTokens.length, SCORING.TITLE_TOKEN_CAP) * SCORING.TITLE_TOKEN_BOOST_PER
  );
}

function calculateSlugBoost(slug: string | undefined, exactQuery: string): number {
  if (!slug) {
    return 0;
  }

  if (slug === exactQuery || exactQuery.includes(slug)) {
    return SCORING.SLUG_EXACT_BOOST;
  }

  return 0;
}

function calculateTagBoost(tags: string[], queryTokens: string[]): number {
  const matchingTags = tags.filter((tag) => queryTokens.some((token) => tag.includes(token)));
  return matchingTags.length * SCORING.TAG_BOOST_PER;
}

function calculateSectionBoost(sectionTitle: string, queryTokens: string[]): number {
  return queryTokens.some((token) => sectionTitle.includes(token)) ? SCORING.SECTION_BOOST : 0;
}

function calculateContentTypeBoost(
  contentType: RetrievedChunk["contentType"],
  classification: QueryClassification
): number {
  const preferredContentType = classification.preferredContentTypes.includes(contentType);

  if (preferredContentType) {
    return classification.strictContentTypes
      ? SCORING.CONTENT_TYPE_PREFERRED_STRICT
      : SCORING.CONTENT_TYPE_PREFERRED_RELAXED;
  }

  return classification.strictContentTypes ? SCORING.CONTENT_TYPE_PENALTY_STRICT : 0;
}

function calculateCurrentPageBoost(
  currentBlogSlug: string | undefined,
  slug: string | undefined
): number {
  return currentBlogSlug && slug === currentBlogSlug ? SCORING.CURRENT_PAGE_BOOST : 0;
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
        calculateRecencyBoost(match.publishedAt) +
        calculateExperienceOrderBoost(match.contentType, match.orderIndex);

      return {
        ...match,
        score
      };
    })
    .sort((left, right) => right.score - left.score);
}
