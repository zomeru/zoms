import { Index } from "@upstash/vector";

import { getAiEnv } from "@/lib/ai/env";

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

class UpstashVectorClient implements VectorIndexClient {
  constructor(private readonly index: Index<VectorChunkMetadata>) {}

  async deleteByPrefix(prefix: string): Promise<void> {
    await this.index.delete({ prefix });
  }

  async query(input: {
    filter?: string;
    query: string;
    topK: number;
  }): Promise<VectorQueryMatch[]> {
    return (await this.index.query({
      data: input.query,
      filter: input.filter,
      includeData: true,
      includeMetadata: true,
      topK: input.topK
    })) as VectorQueryMatch[];
  }

  async upsert(records: VectorUpsertRecord[]): Promise<void> {
    await this.index.upsert(records);
  }
}

let cachedClient: VectorIndexClient | null = null;

export function getVectorIndexClient(): VectorIndexClient {
  if (cachedClient) return cachedClient;

  const env = getAiEnv();

  cachedClient = new UpstashVectorClient(
    new Index<VectorChunkMetadata>({
      token: env.UPSTASH_VECTOR_REST_TOKEN,
      url: env.UPSTASH_VECTOR_REST_URL
    })
  );
  return cachedClient;
}
