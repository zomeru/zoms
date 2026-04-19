import type { NormalizedContentDocument } from "@/lib/content/types";
import { withDbRetry } from "@/lib/db/retry";
import { toPrismaJsonValue } from "@/lib/json";
import type { VectorIndexClient, VectorUpsertRecord } from "@/lib/vector/index";

import { chunkDocument } from "./chunk";
import { createDocumentHash, createDocumentVectorPrefix } from "./hash";

export interface IndexedDocumentSnapshot {
  contentHash: string;
}

export interface IndexedDocumentStore {
  getByDocumentId: (documentId: string) => Promise<IndexedDocumentSnapshot | null>;
  listAllHashes?: () => Promise<Map<string, string>>;
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

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      // biome-ignore lint/style/noNonNullAssertion: bounded index
      results[i] = await fn(items[i]!, i);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function reindexDocuments(
  input: ReindexDocumentsInput
): Promise<ReindexDocumentsResult> {
  // Single SELECT of all existing hashes — avoids N findUnique roundtrips.
  const hashMap = (await input.indexedDocumentStore.listAllHashes?.()) ?? new Map<string, string>();

  // Classify: skip unchanged, collect changed with pre-computed chunks.
  type Changed = {
    chunks: Awaited<ReturnType<typeof chunkDocument>>;
    contentHash: string;
    document: NormalizedContentDocument;
  };

  const changed: Changed[] = [];
  let skipped = 0;

  await Promise.all(
    input.documents.map(async (document) => {
      const contentHash = createDocumentHash(document);
      const existing = hashMap.get(document.documentId);

      if (existing === contentHash) {
        skipped++;
        return;
      }

      const chunks = await chunkDocument(document);
      changed.push({ chunks, contentHash, document });
    })
  );

  if (changed.length === 0) {
    return {
      processed: input.documents.length,
      skipped,
      updated: 0
    };
  }

  // Clear + upsert metadata rows in parallel (bounded). Must finish before embedding UPDATE
  // since the vector UPDATE targets rows by documentId.
  await mapLimit(changed, 5, async ({ chunks, contentHash, document }) => {
    await input.vectorClient.deleteByPrefix(createDocumentVectorPrefix(document.documentId));
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
  });

  // Single vectorClient.upsert call with all chunks — lets the implementation batch
  // embedding calls (one HTTP round-trip for up to 32 docs) and parallelize UPDATEs.
  const vectorRecords = changed.flatMap(({ chunks, document }) =>
    toVectorRecords(document, chunks)
  );
  await input.vectorClient.upsert(vectorRecords);

  return {
    processed: input.documents.length,
    skipped,
    updated: changed.length
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
    import("@/generated/prisma/client"),
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
  const run = await withDbRetry(
    () =>
      repositories.createIngestionRun({
        mode: options.documentId ? IngestionMode.TARGETED : IngestionMode.FULL,
        targetDocumentId: options.documentId
      }),
    { label: "createIngestionRun" }
  );

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

    for (const documentId of legacyExperienceDocumentIds) {
      await vectorClient.deleteByPrefix(createDocumentVectorPrefix(documentId));
      await withDbRetry(() => repositories.deleteIndexedDocument(documentId), {
        label: "deleteIndexedDocument"
      });
    }

    const result = await reindexDocuments({
      documents: filteredDocuments,
      indexedDocumentStore: {
        async getByDocumentId(documentId) {
          const indexedDocument = await withDbRetry(
            () => repositories.getIndexedDocument(documentId),
            { label: "getIndexedDocument" }
          );

          return indexedDocument
            ? {
                contentHash: indexedDocument.contentHash
              }
            : null;
        },
        async listAllHashes() {
          return await withDbRetry(() => repositories.listIndexedDocumentHashes(), {
            label: "listIndexedDocumentHashes"
          });
        },
        async upsert(document) {
          await withDbRetry(
            () =>
              repositories.upsertIndexedDocument({
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
              }),
            { label: "upsertIndexedDocument" }
          );
        }
      },
      vectorClient
    });

    await withDbRetry(
      () =>
        repositories.finishIngestionRun({
          id: run.id,
          status: IngestionStatus.SUCCEEDED,
          summary: toPrismaJsonValue(result)
        }),
      { label: "finishIngestionRun" }
    );

    return {
      ...result,
      runId: run.id
    };
  } catch (error) {
    try {
      await withDbRetry(
        () =>
          repositories.finishIngestionRun({
            errorMessage: error instanceof Error ? error.message : String(error),
            id: run.id,
            status: IngestionStatus.FAILED
          }),
        { label: "finishIngestionRun(failed)" }
      );
    } catch (finishErr) {
      console.warn(
        "[reindex] failed to mark ingestion run as failed:",
        finishErr instanceof Error ? finishErr.message : String(finishErr)
      );
    }

    throw error;
  }
}
