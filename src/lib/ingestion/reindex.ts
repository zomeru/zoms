import type { NormalizedContentDocument } from "@/lib/content/types";
import { toPrismaJsonValue } from "@/lib/json";
import type { VectorIndexClient, VectorUpsertRecord } from "@/lib/vector/index";

import { chunkDocument } from "./chunk";
import { createDocumentHash, createDocumentVectorPrefix } from "./hash";

export interface IndexedDocumentSnapshot {
  contentHash: string;
}

export interface IndexedDocumentStore {
  getByDocumentId: (documentId: string) => Promise<IndexedDocumentSnapshot | null>;
  upsert: (input: {
    chunkCount: number;
    contentHash: string;
    contentType: NormalizedContentDocument["contentType"];
    documentId: string;
    publishedAt?: string;
    slug?: string;
    sourceMeta: Record<string, unknown>;
    tags: string[];
    title: string;
    url: string;
  }) => Promise<void>;
}

export interface ReindexDocumentsInput {
  documents: NormalizedContentDocument[];
  indexedDocumentStore: IndexedDocumentStore;
  vectorClient: VectorIndexClient;
}

export interface ReindexDocumentsResult {
  processed: number;
  skipped: number;
  updated: number;
}

function getSourceMetaString(sourceMeta: Record<string, unknown>, key: string): string | undefined {
  const value = sourceMeta[key];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toVectorRecords(
  document: NormalizedContentDocument,
  chunks: Awaited<ReturnType<typeof chunkDocument>>
): VectorUpsertRecord[] {
  return chunks.map((chunk) => ({
    data: chunk.content,
    id: chunk.id,
    metadata: {
      contentType: document.contentType,
      documentId: document.documentId,
      publishedAt: document.publishedAt,
      sectionId: chunk.sectionId,
      sectionTitle: chunk.sectionTitle,
      slug: document.slug,
      tags: document.tags,
      title: document.title,
      url: document.url
    }
  }));
}

export async function reindexDocuments(
  input: ReindexDocumentsInput
): Promise<ReindexDocumentsResult> {
  const results = await Promise.all(
    input.documents.map(async (document) => {
      const contentHash = createDocumentHash(document);
      const existing = await input.indexedDocumentStore.getByDocumentId(document.documentId);

      if (existing?.contentHash === contentHash) {
        return "skipped" as const;
      }

      const chunks = await chunkDocument(document);

      await input.vectorClient.deleteByPrefix(createDocumentVectorPrefix(document.documentId));
      await input.vectorClient.upsert(toVectorRecords(document, chunks));
      await input.indexedDocumentStore.upsert({
        chunkCount: chunks.length,
        contentHash,
        contentType: document.contentType,
        documentId: document.documentId,
        publishedAt: document.publishedAt,
        slug: document.slug,
        sourceMeta: document.sourceMeta,
        tags: document.tags,
        title: document.title,
        url: document.url
      });

      return "updated" as const;
    })
  );

  return {
    processed: input.documents.length,
    skipped: results.filter((result) => result === "skipped").length,
    updated: results.filter((result) => result === "updated").length
  };
}

export async function loadNormalizedDocuments(): Promise<NormalizedContentDocument[]> {
  const [
    { loadAboutDocuments },
    { loadExperienceDocuments },
    { loadProjectDocuments },
    { loadBlogDocuments }
  ] = await Promise.all([
    import("@/lib/content/about"),
    import("@/lib/content/experience"),
    import("@/lib/content/projects"),
    import("@/lib/content/blog")
  ]);
  const [aboutDocuments, experienceDocuments, projectDocuments, blogDocuments] = await Promise.all([
    loadAboutDocuments(),
    loadExperienceDocuments(),
    loadProjectDocuments(),
    loadBlogDocuments()
  ]);

  return [...aboutDocuments, ...experienceDocuments, ...projectDocuments, ...blogDocuments];
}

export async function runSiteReindex(
  options: { documentId?: string } = {}
): Promise<ReindexDocumentsResult & { runId: string }> {
  const [
    { IndexedContentType, IngestionMode, IngestionStatus },
    { repositories },
    { getVectorIndexClient },
    { getLegacyExperienceDocumentId }
  ] = await Promise.all([
    import("@prisma/client"),
    import("@/lib/db/repositories"),
    import("@/lib/vector/index"),
    import("@/lib/content/experience")
  ]);
  const documents = await loadNormalizedDocuments();
  const filteredDocuments =
    options.documentId === undefined
      ? documents
      : documents.filter(
          (document) =>
            document.documentId === options.documentId || document.slug === options.documentId
        );

  const mapContentType = (contentType: NormalizedContentDocument["contentType"]) => {
    switch (contentType) {
      case "about":
        return IndexedContentType.ABOUT;
      case "blog":
        return IndexedContentType.BLOG;
      case "experience":
        return IndexedContentType.EXPERIENCE;
      case "project":
        return IndexedContentType.PROJECT;
    }
  };
  const run = await repositories.createIngestionRun({
    mode: options.documentId ? IngestionMode.TARGETED : IngestionMode.FULL,
    targetDocumentId: options.documentId
  });

  try {
    const legacyExperienceDocumentIds = filteredDocuments
      .filter((document) => document.contentType === "experience")
      .map((document) => {
        const title = getSourceMetaString(document.sourceMeta, "title");
        const company = getSourceMetaString(document.sourceMeta, "company");

        return title && company ? getLegacyExperienceDocumentId(title, company) : undefined;
      })
      .filter((documentId): documentId is string => Boolean(documentId));
    const vectorClient = getVectorIndexClient();

    await Promise.all(
      legacyExperienceDocumentIds.map(async (documentId) => {
        await vectorClient.deleteByPrefix(createDocumentVectorPrefix(documentId));
        await repositories.deleteIndexedDocument(documentId);
      })
    );

    const result = await reindexDocuments({
      documents: filteredDocuments,
      indexedDocumentStore: {
        async getByDocumentId(documentId) {
          const indexedDocument = await repositories.getIndexedDocument(documentId);

          return indexedDocument
            ? {
                contentHash: indexedDocument.contentHash
              }
            : null;
        },
        async upsert(document) {
          await repositories.upsertIndexedDocument({
            chunkCount: document.chunkCount,
            contentHash: document.contentHash,
            contentType: mapContentType(document.contentType),
            documentId: document.documentId,
            ingestionRunId: run.id,
            publishedAt: document.publishedAt ? new Date(document.publishedAt) : undefined,
            slug: document.slug,
            sourceMeta: toPrismaJsonValue(document.sourceMeta),
            tags: document.tags,
            title: document.title,
            url: document.url
          });
        }
      },
      vectorClient
    });

    await repositories.finishIngestionRun({
      id: run.id,
      status: IngestionStatus.SUCCEEDED,
      summary: toPrismaJsonValue(result)
    });

    return {
      ...result,
      runId: run.id
    };
  } catch (error) {
    await repositories.finishIngestionRun({
      errorMessage: error instanceof Error ? error.message : String(error),
      id: run.id,
      status: IngestionStatus.FAILED
    });

    throw error;
  }
}
