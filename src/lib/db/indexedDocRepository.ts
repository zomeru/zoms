import type { IndexedContentType, Prisma } from "@/generated/prisma/client";

import { getPrismaClient } from "./prisma";
import { withDbRetry } from "./retry";

export interface IndexedDocumentInput {
  chunkCount: number;
  contentHash: string;
  contentType: IndexedContentType;
  documentId: string;
  ingestionRunId?: string;
  lastIndexedAt?: Date;
  publishedAt?: Date;
  slug?: string;
  sourceMeta: Prisma.InputJsonValue;
  tags?: string[];
  title: string;
  url: string;
}

export const indexedDocRepository = {
  async deleteIndexedDocument(documentId: string) {
    await withDbRetry(
      () => getPrismaClient().indexedDocument.deleteMany({ where: { documentId } }),
      { label: "deleteIndexedDocument" }
    );
  },

  async getIndexedDocument(documentId: string) {
    return await withDbRetry(
      () =>
        getPrismaClient().indexedDocument.findUnique({
          where: { documentId },
          select: { contentHash: true }
        }),
      { label: "getIndexedDocument" }
    );
  },

  async listIndexedDocumentHashes(): Promise<Map<string, string>> {
    const rows = await withDbRetry(
      () =>
        getPrismaClient().indexedDocument.findMany({
          select: { contentHash: true, documentId: true }
        }),
      { label: "listIndexedDocumentHashes" }
    );
    return new Map(rows.map((row) => [row.documentId, row.contentHash]));
  },

  async upsertIndexedDocument(input: IndexedDocumentInput) {
    return await withDbRetry(
      () =>
        getPrismaClient().indexedDocument.upsert({
          where: { documentId: input.documentId },
          update: {
            chunkCount: input.chunkCount,
            contentHash: input.contentHash,
            contentType: input.contentType,
            ingestionRunId: input.ingestionRunId,
            lastIndexedAt: input.lastIndexedAt ?? new Date(),
            publishedAt: input.publishedAt,
            slug: input.slug,
            sourceMeta: input.sourceMeta,
            tags: input.tags ?? [],
            title: input.title,
            url: input.url
          },
          create: {
            chunkCount: input.chunkCount,
            contentHash: input.contentHash,
            contentType: input.contentType,
            documentId: input.documentId,
            ingestionRunId: input.ingestionRunId,
            lastIndexedAt: input.lastIndexedAt ?? new Date(),
            publishedAt: input.publishedAt,
            slug: input.slug,
            sourceMeta: input.sourceMeta,
            tags: input.tags ?? [],
            title: input.title,
            url: input.url
          }
        }),
      { label: "upsertIndexedDocument" }
    );
  }
};
