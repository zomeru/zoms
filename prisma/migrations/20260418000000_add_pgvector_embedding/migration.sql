-- Add full-text content column (returned to LLM during retrieval)
ALTER TABLE "IndexedDocument" ADD COLUMN IF NOT EXISTS "content" TEXT;

-- Add pgvector embedding column (1536 dims = openai/text-embedding-3-small)
ALTER TABLE "IndexedDocument" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS "IndexedDocument_embedding_hnsw_idx"
  ON "IndexedDocument"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
