import type { Citation } from "@/lib/ai/schemas";

import type { QueryClassification } from "./classify";
import type { RetrievedChunk } from "./types";

function getDefaultClassification(): QueryClassification {
  return {
    intent: "GENERAL_PORTFOLIO_QUERY",
    preferredContentTypes: ["about", "experience", "project", "blog"],
    query: "",
    strictContentTypes: false,
    tokens: []
  };
}

function getCitationKey(match: RetrievedChunk): string {
  if (match.contentType === "blog") {
    return `blog:${match.url}`;
  }

  return `${match.contentType}:${match.id}`;
}

export function buildCitations(
  matches: RetrievedChunk[],
  classification: QueryClassification = getDefaultClassification(),
  limit = 3
): Citation[] {
  const relevantMatches = matches.filter(
    (match) =>
      match.score >= (classification.strictContentTypes ? 0.45 : 0.35) &&
      (!classification.strictContentTypes ||
        classification.preferredContentTypes.includes(match.contentType))
  );
  const seen = new Set<string>();

  return relevantMatches
    .filter((match) => {
      const key = getCitationKey(match);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((match) => ({
      contentType: match.contentType,
      id: match.id,
      sectionTitle: match.sectionTitle,
      snippet: match.contentType === "blog" ? match.title : match.content.slice(0, 220),
      title: match.title,
      url: match.url
    }));
}
