import 'server-only';

import { after } from 'next/server';

import { repositories } from '@/lib/db/repositories';
import { createDocumentVectorPrefix } from '@/lib/ingestion/hash';
import log from '@/lib/logger';
import { getVectorIndexClient } from '@/lib/vector/index';

export function scheduleDeletedBlogCleanup(
  slug: string,
  schedulePostResponseWork: (callback: () => void | Promise<void>) => void = after
): void {
  const documentId = `blog:${slug}`;

  schedulePostResponseWork(async () => {
    try {
      await getVectorIndexClient().deleteByPrefix(createDocumentVectorPrefix(documentId));
      await repositories.deleteIndexedDocument(documentId);

      log.info('Deleted blog cleanup completed after removal', {
        documentId,
        slug
      });
    } catch (error) {
      log.error('Deleted blog cleanup failed after removal', {
        documentId,
        error: error instanceof Error ? error.message : String(error),
        slug
      });
    }
  });
}
