-- Upgrade embedding columns to halfvec(2048) so HNSW indexes work at 2048 dims.
-- pgvector's HNSW caps at 2000 dims for `vector` but supports up to 4000 for `halfvec`.
-- OpenRouter default embedding model (nvidia/llama-nemotron-embed-vl-1b-v2) produces
-- 2048-dim vectors. halfvec stores half-precision floats — negligible accuracy loss for
-- cosine similarity, ~50% smaller on disk.
--
-- Drop/recreate columns (vs ALTER TYPE) avoids pgvector cast limitations when the source
-- dim (1536) differs from the target dim (2048). Existing embeddings would be invalid
-- anyway after the model change — `content` on IndexedDocument is preserved so reindex
-- only needs to recompute vectors, not re-fetch source data.
--
-- POST-DEPLOY: run `pnpm ai:reindex` to repopulate IndexedDocument.embedding.
-- ChatMessage embeddings backfill lazily as new messages arrive.

-- --- IndexedDocument ------------------------------------------------------
DROP INDEX IF EXISTS "IndexedDocument_embedding_hnsw_idx";
ALTER TABLE "IndexedDocument" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "IndexedDocument" ADD COLUMN "embedding" halfvec(2048);

CREATE INDEX IF NOT EXISTS "IndexedDocument_embedding_hnsw_idx"
  ON "IndexedDocument"
  USING hnsw (embedding halfvec_cosine_ops);

-- --- ChatMessage ----------------------------------------------------------
DROP INDEX IF EXISTS "ChatMessage_embedding_hnsw_idx";
ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "ChatMessage" ADD COLUMN "embedding" halfvec(2048);

CREATE INDEX IF NOT EXISTS "ChatMessage_embedding_hnsw_idx"
  ON "ChatMessage"
  USING hnsw (embedding halfvec_cosine_ops);
