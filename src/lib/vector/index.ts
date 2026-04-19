import { getAiEnv, getEmbeddingModel } from "@/lib/ai/env";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDbRetry } from "@/lib/db/retry";

export interface VectorChunkMetadata extends Record<string, string | string[] | undefined> {
  contentType: string;
  documentId: string;
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

// Validates and maps lowercase content type values to DB enum format
const VALID_CONTENT_TYPES = new Set(["ABOUT", "BLOG", "EXPERIENCE", "PROJECT"]);

function parseContentTypeFilter(filter?: string): string {
  if (!filter) return "";
  const match = filter.match(/contentType\s*=\s*'([^']+)'/);
  if (!match?.[1]) return "";
  const ct = match[1].toUpperCase();
  return VALID_CONTENT_TYPES.has(ct) ? `AND "contentType" = '${ct}'` : "";
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const env = getAiEnv();
  const model = getEmbeddingModel(env);

  // OpenRouter/OpenAI embeddings accept input: string | string[].
  // Chunk to stay under per-request limits; 32 is safe for most embedding models.
  const BATCH_SIZE = 32;
  const result: number[][] = new Array(texts.length);
  const inputs = texts.map((t) => t.slice(0, 8000));

  for (let offset = 0; offset < inputs.length; offset += BATCH_SIZE) {
    const slice = inputs.slice(offset, offset + BATCH_SIZE);

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dimensions: 1536,
        input: slice,
        model
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Embedding API error ${response.status}: ${body}`);
    }

    const json = (await response.json()) as {
      data: Array<{ embedding: number[]; index?: number }>;
    };

    if (!json.data || json.data.length !== slice.length) {
      throw new Error(
        `Embedding API returned ${json.data?.length ?? 0} embeddings for ${slice.length} inputs`
      );
    }

    for (let i = 0; i < json.data.length; i++) {
      const item = json.data[i];
      if (!item) {
        throw new Error(`Embedding API returned no embedding at index ${i}`);
      }
      const idx = item.index ?? i;
      result[offset + idx] = item.embedding;
    }
  }

  return result;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  if (!embedding) {
    throw new Error("Embedding API returned no embedding data");
  }
  return embedding;
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
  score: number;
};

class SupabaseVectorClient implements VectorIndexClient {
  async deleteByPrefix(prefix: string): Promise<void> {
    // prefix format: "doc:{documentId}:"
    // Clear the embedding so stale vectors are not returned during re-embedding
    const documentId = prefix.replace(/^doc:/, "").replace(/:$/, "");

    await withDbRetry(async () => {
      const db = getPrismaClient();
      await db.$executeRawUnsafe(
        `UPDATE "IndexedDocument" SET embedding = NULL, content = NULL WHERE "documentId" = $1`,
        documentId
      );
    });
  }

  async query(input: {
    filter?: string;
    query: string;
    topK: number;
  }): Promise<VectorQueryMatch[]> {
    const embedding = await generateEmbedding(input.query);
    const vectorStr = `[${embedding.join(",")}]`;
    const contentTypeFilter = parseContentTypeFilter(input.filter);

    const rows = await withDbRetry(() => {
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
           1 - (embedding <=> $1::vector) AS score
         FROM "IndexedDocument"
         WHERE embedding IS NOT NULL ${contentTypeFilter}
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        vectorStr,
        input.topK
      );
    });

    return rows.map((row) => ({
      id: row.id,
      data: row.content ?? row.title,
      score: Number(row.score),
      metadata: {
        contentType: row.contentType.toLowerCase(),
        documentId: row.documentId,
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

    // Group chunk records by documentId — one embedding per document
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

    // Batch embedding call (one HTTP round-trip per 32 docs) — major speedup vs per-doc calls.
    const embeddings = await generateEmbeddings(contents);

    // Parallel UPDATEs with bounded concurrency — pgvector on heap handles concurrent HNSW
    // writes fine, but limit to 5 so we don't exhaust the pg pool (max: 3-10 connections).
    await mapLimit(docIds, 5, async (documentId, i) => {
      const content = contents[i];
      const embedding = embeddings[i];
      if (content === undefined || embedding === undefined) return;
      const vectorStr = `[${embedding.join(",")}]`;

      await withDbRetry(async () => {
        const db = getPrismaClient();
        await db.$executeRawUnsafe(
          `UPDATE "IndexedDocument"
           SET content = $1, embedding = $2::vector
           WHERE "documentId" = $3`,
          content,
          vectorStr,
          documentId
        );
      });
    });
  }
}

let cachedClient: VectorIndexClient | null = null;

export function getVectorIndexClient(): VectorIndexClient {
  if (cachedClient) return cachedClient;
  cachedClient = new SupabaseVectorClient();
  return cachedClient;
}
