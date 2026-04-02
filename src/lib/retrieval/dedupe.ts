import type { RetrievedChunk } from "./types";

export function dedupeRetrievedChunks(matches: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<string>();

  return matches.filter((match) => {
    if (seen.has(match.id)) {
      return false;
    }

    seen.add(match.id);
    return true;
  });
}

export function limitChunksPerDocument(matches: RetrievedChunk[], limit: number): RetrievedChunk[] {
  const documentCounts = new Map<string, number>();

  return matches.filter((match) => {
    const count = documentCounts.get(match.documentId) ?? 0;

    if (count >= limit) {
      return false;
    }

    documentCounts.set(match.documentId, count + 1);
    return true;
  });
}
