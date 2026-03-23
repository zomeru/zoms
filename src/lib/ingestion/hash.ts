import { createHash } from 'node:crypto';

import type { NormalizedContentDocument } from '@/lib/content/types';

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, innerValue]) => [key, sortValue(innerValue)])
    );
  }

  return value;
}

export function createStableHash(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(sortValue(value)))
    .digest('hex');
}

export function createDocumentHash(document: NormalizedContentDocument): string {
  return createStableHash({
    contentType: document.contentType,
    documentId: document.documentId,
    publishedAt: document.publishedAt,
    sections: document.sections,
    slug: document.slug,
    sourceMeta: document.sourceMeta,
    tags: document.tags,
    title: document.title,
    url: document.url
  });
}

export function createDocumentVectorPrefix(documentId: string): string {
  return `doc:${documentId}:`;
}

export function createChunkId(
  documentId: string,
  sectionId: string,
  index: number,
  content: string
): string {
  return `${createDocumentVectorPrefix(documentId)}${sectionId}:${index}:${createStableHash(content).slice(0, 12)}`;
}
