import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { embed, embedMany } from "ai";

import { getAiEnv } from "@/lib/ai/env";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDbRetry } from "@/lib/db/retry";

export interface VectorChunkMetadata {
  contentType: string;
  documentId: string;
  orderIndex?: number;
  publishedAt?: string;
  sectionId: string;
  sectionTitle: string;
  slug?: string;
  tags: string[];
  title: string;
  url: string;
}

export interface VectorQueryMatch {
  data?: string;
  id: string | number;
  metadata?: VectorChunkMetadata;
  score: number;
}

export interface VectorUpsertRecord {
  data: string;
  id: string;
  metadata: VectorChunkMetadata;
}

export interface VectorIndexClient {
  deleteByPrefix: (prefix: string) => Promise<void>;
  query: (input: { filter?: string; query: string; topK: number }) => Promise<VectorQueryMatch[]>;
  upsert: (records: VectorUpsertRecord[]) => Promise<void>;
}

const MAX_EMBEDDING_INPUT_CHARS = 8000;
const EMBEDDING_BATCH_SIZE = 32;
const UPSERT_CONCURRENCY = 5;

const VALID_CONTENT_TYPES = new Set(["ABOUT", "BLOG", "EXPERIENCE", "PROJECT"]);

function parseContentTypeFilter(filter?: string): string {
  if (!filter) return "";
  const match = filter.match(/contentType\s*=\s*'([^']+)'/);
  if (!match?.[1]) return "";
  const ct = match[1].toUpperCase();
  return VALID_CONTENT_TYPES.has(ct) ? `AND "contentType" = '${ct}'` : "";
}

let cachedModel: ReturnType<ReturnType<typeof createOpenRouter>["textEmbeddingModel"]> | null =
  null;

function getEmbeddingModel() {
  if (cachedModel) return cachedModel;
  const env = getAiEnv();
  const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
  cachedModel = openrouter.textEmbeddingModel(env.OPENROUTER_EMBEDDING_MODEL);
  return cachedModel;
}

async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text.slice(0, MAX_EMBEDDING_INPUT_CHARS)
  });
  return embedding;
}

async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const inputs = texts.map((t) => t.slice(0, MAX_EMBEDDING_INPUT_CHARS));
  const result: number[][] = new Array(inputs.length);

  for (let offset = 0; offset < inputs.length; offset += EMBEDDING_BATCH_SIZE) {
    const slice = inputs.slice(offset, offset + EMBEDDING_BATCH_SIZE);
    const { embeddings } = await embedMany({
      model: getEmbeddingModel(),
      values: slice
    });
    if (embeddings.length !== slice.length) {
      throw new Error(
        `OpenRouter embeddings returned ${embeddings.length} vectors for ${slice.length} inputs`
      );
    }
    for (let i = 0; i < embeddings.length; i++) {
      result[offset + i] = embeddings[i] as number[];
    }
  }

  return result;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return await embedQuery(text);
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

type IndexedDocumentRow = {
  id: string;
  documentId: string;
  contentType: string;
  title: string;
  slug: string | null;
  url: string;
  publishedAt: Date | null;
  tags: string[];
  content: string | null;
  sourceMeta: Record<string, unknown> | null;
  score: number;
};

function extractOrderIndex(sourceMeta: Record<string, unknown> | null): number | undefined {
  if (!sourceMeta) return undefined;
  const raw = sourceMeta.order;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

class SupabaseVectorClient implements VectorIndexClient {
  async deleteByPrefix(prefix: string): Promise<void> {
    // prefix format: "doc:{documentId}:" — IndexedDocument.documentId is stored without
    // the "doc:" wrapper, so strip it to recover the row key.
    const documentId = prefix.replace(/^doc:/, "").replace(/:$/, "");
    await withDbRetry(
      async () => {
        const db = getPrismaClient();
        await db.$executeRawUnsafe(
          `UPDATE "IndexedDocument"
           SET embedding = NULL, content = NULL
           WHERE "documentId" = $1`,
          documentId
        );
      },
      { label: "vector.deleteByPrefix" }
    );
  }

  async query(input: {
    filter?: string;
    query: string;
    topK: number;
  }): Promise<VectorQueryMatch[]> {
    const embedding = await embedQuery(input.query);
    const vectorStr = `[${embedding.join(",")}]`;
    const contentTypeFilter = parseContentTypeFilter(input.filter);

    const rows = await withDbRetry(
      () => {
        const db = getPrismaClient();
        return db.$queryRawUnsafe<IndexedDocumentRow[]>(
          `SELECT
             id,
             "documentId",
             "contentType",
             title,
             slug,
             url,
             "publishedAt",
             tags,
             content,
             "sourceMeta",
             1 - (embedding <=> $1::halfvec) AS score
           FROM "IndexedDocument"
           WHERE embedding IS NOT NULL ${contentTypeFilter}
           ORDER BY embedding <=> $1::halfvec
           LIMIT $2`,
          vectorStr,
          input.topK
        );
      },
      { label: "vector.query" }
    );

    return rows.map((row) => ({
      id: row.id,
      data: row.content ?? row.title,
      score: Number(row.score),
      metadata: {
        contentType: row.contentType.toLowerCase(),
        documentId: row.documentId,
        orderIndex: extractOrderIndex(row.sourceMeta),
        publishedAt: row.publishedAt?.toISOString(),
        sectionId: row.documentId,
        sectionTitle: row.title,
        slug: row.slug ?? undefined,
        tags: row.tags,
        title: row.title,
        url: row.url
      }
    }));
  }

  async upsert(records: VectorUpsertRecord[]): Promise<void> {
    if (records.length === 0) return;

    const byDocument = new Map<string, VectorUpsertRecord[]>();
    for (const record of records) {
      const docId = record.metadata.documentId;
      if (!byDocument.has(docId)) byDocument.set(docId, []);
      // biome-ignore lint/style/noNonNullAssertion: docId is already set
      byDocument.get(docId)!.push(record);
    }

    const docIds: string[] = [];
    const contents: string[] = [];
    for (const [documentId, docRecords] of byDocument) {
      docIds.push(documentId);
      contents.push(docRecords.map((r) => r.data).join("\n\n"));
    }

    const embeddings = await embedDocuments(contents);

    await mapLimit(docIds, UPSERT_CONCURRENCY, async (documentId, i) => {
      const content = contents[i];
      const embedding = embeddings[i];
      if (content === undefined || embedding === undefined) return;
      const vectorStr = `[${embedding.join(",")}]`;

      await withDbRetry(
        async () => {
          const db = getPrismaClient();
          await db.$executeRawUnsafe(
            `UPDATE "IndexedDocument"
             SET content = $1, embedding = $2::halfvec
             WHERE "documentId" = $3`,
            content,
            vectorStr,
            documentId
          );
        },
        { label: "vector.upsert" }
      );
    });
  }
}

let cachedClient: VectorIndexClient | null = null;

export function getVectorIndexClient(): VectorIndexClient {
  if (cachedClient) return cachedClient;
  cachedClient = new SupabaseVectorClient();
  return cachedClient;
}
