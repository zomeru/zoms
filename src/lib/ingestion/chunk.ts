import type { NormalizedContentDocument } from "@/lib/content/types";

import { createChunkId } from "./hash";
import { stripMarkdown } from "./normalize";

export interface ContentChunk {
  content: string;
  documentId: string;
  id: string;
  plainText: string;
  sectionId: string;
  sectionTitle: string;
}

export interface ChunkDocumentOptions {
  chunkOverlap: number;
  chunkSize: number;
}

const defaultOptions: ChunkDocumentOptions = {
  chunkOverlap: 120,
  chunkSize: 900
};

/**
 * Splits text into overlapping chunks using natural boundaries.
 * Tries paragraph breaks, then newlines, then falls back to hard character splits.
 */
function splitText(text: string, chunkSize: number, chunkOverlap: number): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  for (const separator of ["\n\n", "\n", " "]) {
    if (!text.includes(separator)) continue;

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = start + chunkSize;

      if (end >= text.length) {
        const tail = text.slice(start);
        if (tail.trim().length > 0) chunks.push(tail);
        break;
      }

      const window = text.slice(start, end);
      const lastSep = window.lastIndexOf(separator);

      if (lastSep > 0) {
        const splitEnd = start + lastSep;
        chunks.push(text.slice(start, splitEnd));
        start = Math.max(start + 1, splitEnd - chunkOverlap);
      } else {
        // No natural break found — hard split at chunk boundary
        chunks.push(text.slice(start, end));
        start = end - chunkOverlap;
      }
    }

    const valid = chunks.filter((c) => c.trim().length > 0);
    if (valid.length > 0) return valid;
  }

  // Last-resort: hard character split
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks.filter((c) => c.trim().length > 0);
}

export async function chunkDocument(
  document: NormalizedContentDocument,
  options: Partial<ChunkDocumentOptions> = {}
): Promise<ContentChunk[]> {
  const { chunkOverlap, chunkSize } = { ...defaultOptions, ...options };

  const chunkGroups = document.sections.map((section) => {
    const baseContent = `# ${document.title}\n## ${section.title}\n\n${section.content}`.trim();
    const parts =
      baseContent.length <= chunkSize
        ? [baseContent]
        : splitText(baseContent, chunkSize, chunkOverlap);

    return parts.map((content, index) => ({
      content,
      documentId: document.documentId,
      id: createChunkId(document.documentId, section.id, index, content),
      plainText: stripMarkdown(content),
      sectionId: section.id,
      sectionTitle: section.title
    }));
  });

  return chunkGroups.flat();
}
