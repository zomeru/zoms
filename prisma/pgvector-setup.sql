-- ============================================================
-- Run these steps in order BEFORE running prisma migrations.
-- All SQL runs in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- STEP 1: Enable pgvector
-- pgvector is a Supabase built-in extension. Enable it here OR via
-- Dashboard → Database → Extensions → search "vector" → Enable.
-- It works alongside OrioleDB (separate concerns: storage vs. vector ops).
create extension if not exists vector;

-- STEP 2: Run Prisma migrations
-- Use `migrate deploy` (not `migrate dev`) — Supabase does not support
-- the shadow database that `migrate dev` requires.
--
--   pnpm prisma:deploy          (runs `prisma migrate deploy`)
--
-- This applies all pending migrations directly to the database.

-- STEP 3: After migrations complete, create the HNSW index.
-- Uncomment and run this block AFTER `prisma migrate deploy` finishes.
-- The `embedding` column must exist before creating the index.
--
-- create index if not exists "IndexedDocument_embedding_hnsw_idx"
--   on "IndexedDocument"
--   using hnsw (embedding vector_cosine_ops)
--   with (m = 16, ef_construction = 64);
--
-- HNSW params:
--   m = 16               → graph connectivity (higher = better recall, more memory)
--   ef_construction = 64 → build accuracy (raise to 128 for higher recall)
--
-- OrioleDB note: HNSW indexes are created the same way on OrioleDB-backed
-- tables. No changes needed to the index creation syntax.
