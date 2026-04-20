import "server-only";

import type { ContentType } from "@/lib/content/types";
import type { VectorQueryMatch } from "@/lib/vector/index";

import { buildCitations } from "./citations";
import { classifyQueryIntent, type QueryClassification, type QueryIntent } from "./classify";
import { dedupeRetrievedChunks, limitChunksPerDocument } from "./dedupe";
import { rankRetrievedChunks } from "./rank";
import type { RetrievalResult, RetrievedChunk } from "./types";

interface RetrievalSearchInput {
  classification?: QueryClassification;
  currentBlogSlug?: string;
  query: string;
  vectorQuery: (input: {
    filter?: string;
    query: string;
    topK: number;
  }) => Promise<VectorQueryMatch[]>;
}

const TOP_K = 12;

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function isContentType(value: string): value is RetrievedChunk["contentType"] {
  return value === "about" || value === "blog" || value === "experience" || value === "project";
}

function toRetrievedChunk(match: VectorQueryMatch): RetrievedChunk | null {
  if (!match.metadata || !match.data) {
    return null;
  }

  if (!isContentType(match.metadata.contentType)) {
    return null;
  }

  return {
    content: match.data,
    contentType: match.metadata.contentType,
    documentId: match.metadata.documentId,
    id: String(match.id),
    orderIndex: match.metadata.orderIndex,
    publishedAt: match.metadata.publishedAt,
    score: match.score,
    sectionId: match.metadata.sectionId,
    sectionTitle: match.metadata.sectionTitle,
    slug: match.metadata.slug,
    tags: match.metadata.tags,
    title: match.metadata.title,
    url: match.metadata.url
  };
}

function rankMatches(input: {
  classification: QueryClassification;
  currentBlogSlug?: string;
  matches: VectorQueryMatch[];
  query: string;
}): RetrievedChunk[] {
  return limitChunksPerDocument(
    dedupeRetrievedChunks(
      rankRetrievedChunks({
        classification: input.classification,
        currentBlogSlug: input.currentBlogSlug,
        matches: input.matches
          .map(toRetrievedChunk)
          .filter((value): value is RetrievedChunk => value !== null),
        query: input.query
      })
    ),
    3
  );
}

function createStrictFilter(classification: QueryClassification): string | undefined {
  if (!classification.strictContentTypes || classification.preferredContentTypes.length !== 1) {
    return undefined;
  }

  return `contentType = '${classification.preferredContentTypes[0]}'`;
}

function createClassification(
  query: string,
  intent: QueryIntent,
  preferredContentTypes: ContentType[],
  strictContentTypes: boolean
): QueryClassification {
  return {
    intent,
    preferredContentTypes,
    query,
    strictContentTypes,
    tokens: tokenize(query)
  };
}

export function shouldRefuseAnswer(
  matches: RetrievedChunk[],
  classification: QueryClassification
): boolean {
  if (matches.length === 0) {
    return true;
  }

  const strongThreshold = classification.strictContentTypes ? 0.45 : 0.35;
  const strongestScore = matches[0]?.score ?? 0;
  const strongMatches = matches.filter((match) => match.score >= strongThreshold);

  if (classification.strictContentTypes) {
    return strongestScore < strongThreshold || strongMatches.length < 1;
  }

  return strongestScore < strongThreshold || strongMatches.length < 2;
}

export async function retrieveRelevantChunks(
  input: RetrievalSearchInput
): Promise<RetrievalResult & { citations: ReturnType<typeof buildCitations> }> {
  const classification = input.classification ?? classifyQueryIntent(input.query);
  const strictFilter = createStrictFilter(classification);
  const filteredMatches = await input.vectorQuery({
    filter: strictFilter,
    query: input.query,
    topK: TOP_K
  });

  let matches = rankMatches({
    classification,
    currentBlogSlug: input.currentBlogSlug,
    matches: filteredMatches,
    query: input.query
  });

  if (strictFilter && (matches.length === 0 || (matches[0]?.score ?? 0) < 0.45)) {
    const fallbackMatches = await input.vectorQuery({
      query: input.query,
      topK: TOP_K
    });

    matches = rankMatches({
      classification,
      currentBlogSlug: input.currentBlogSlug,
      matches: fallbackMatches,
      query: input.query
    });
  }

  const citations = buildCitations(matches, classification);

  return {
    citations,
    classification,
    matches,
    shouldRefuse: shouldRefuseAnswer(matches, classification)
  };
}

export async function retrieveExperience(input: Omit<RetrievalSearchInput, "classification">) {
  return await retrieveRelevantChunks({
    ...input,
    classification: createClassification(input.query, "EXPERIENCE_QUERY", ["experience"], true)
  });
}

export async function retrieveProjects(input: Omit<RetrievalSearchInput, "classification">) {
  return await retrieveRelevantChunks({
    ...input,
    classification: createClassification(input.query, "PROJECT_QUERY", ["project"], true)
  });
}

export async function retrieveBlogs(input: Omit<RetrievalSearchInput, "classification">) {
  return await retrieveRelevantChunks({
    ...input,
    classification: createClassification(input.query, "BLOG_QUERY", ["blog"], true)
  });
}

export async function retrievePortfolio(input: Omit<RetrievalSearchInput, "classification">) {
  return await retrieveRelevantChunks({
    ...input,
    classification: createClassification(
      input.query,
      "GENERAL_PORTFOLIO_QUERY",
      ["about", "experience", "project", "blog"],
      false
    )
  });
}
