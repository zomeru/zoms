-- pgvector embedding for semantic RAG over chat history (scoped to session)
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

CREATE INDEX IF NOT EXISTS "ChatMessage_embedding_hnsw_idx"
  ON "ChatMessage"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
