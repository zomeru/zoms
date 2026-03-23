import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import type { NormalizedContentDocument } from '@/lib/content/types';

import { createChunkId } from './hash';
import { stripMarkdown } from './normalize';

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

export async function chunkDocument(
  document: NormalizedContentDocument,
  options: Partial<ChunkDocumentOptions> = {}
): Promise<ContentChunk[]> {
  const resolvedOptions = {
    ...defaultOptions,
    ...options
  };
  const splitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: resolvedOptions.chunkOverlap,
    chunkSize: resolvedOptions.chunkSize
  });

  const chunkGroups = await Promise.all(
    document.sections.map(async (section) => {
      const baseContent = `# ${document.title}\n## ${section.title}\n\n${section.content}`.trim();
      const splitContent =
        baseContent.length <= resolvedOptions.chunkSize
          ? [baseContent]
          : await splitter.splitText(baseContent);

      return splitContent.map((content, index) => ({
        content,
        documentId: document.documentId,
        id: createChunkId(document.documentId, section.id, index, content),
        plainText: stripMarkdown(content),
        sectionId: section.id,
        sectionTitle: section.title
      }));
    })
  );

  return chunkGroups.flat();
}
