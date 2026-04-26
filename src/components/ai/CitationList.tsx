"use client";

import type { Citation } from "@/lib/ai/schemas";

interface CitationListProps {
  citations: Citation[];
}

function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();

  return citations.filter((citation) => {
    const key =
      citation.contentType === "blog"
        ? `blog:${citation.url}`
        : [
            citation.contentType,
            citation.url,
            citation.title,
            citation.sectionTitle,
            citation.snippet
          ].join("::");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function CitationList({ citations }: CitationListProps) {
  const uniqueCitations = dedupeCitations(citations);

  if (uniqueCitations.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-background/60 p-3">
      <p className="mb-2 font-mono text-[11px] text-text-muted uppercase tracking-[0.22em]">
        Citations
      </p>
      <div className="space-y-2">
        {uniqueCitations.map((citation) => (
          <a
            key={
              citation.contentType === "blog"
                ? `blog:${citation.url}`
                : [
                    citation.contentType,
                    citation.url,
                    citation.title,
                    citation.sectionTitle,
                    citation.snippet
                  ].join("::")
            }
            href={citation.url}
            className="block rounded-xl border border-border/80 bg-surface/80 px-3 py-2 text-sm text-text-primary transition hover:border-primary/40"
          >
            {citation.contentType === "blog" ? (
              <span className="block font-medium">{citation.snippet}</span>
            ) : (
              <>
                <span className="block font-medium">{citation.title}</span>
                <span className="block text-text-muted text-xs">{citation.sectionTitle}</span>
                <span className="mt-1 block text-text-secondary text-xs">{citation.snippet}</span>
              </>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
