-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FeedbackValue" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "IngestionMode" AS ENUM ('FULL', 'TARGETED');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "IndexedContentType" AS ENUM ('BLOG', 'PROJECT', 'ABOUT');

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "pathnameHint" TEXT,
    "blogSlugHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB,
    "groundedAnswer" JSONB,
    "relatedContent" JSONB,
    "transformMode" TEXT,
    "providerMessageId" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerFeedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageId" TEXT,
    "value" "FeedbackValue" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitationClick" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageId" TEXT,
    "citationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitationClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoResultEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "question" TEXT NOT NULL,
    "pagePath" TEXT,
    "pageSlug" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoResultEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetrievalEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userMessageId" TEXT,
    "assistantMessageId" TEXT,
    "query" TEXT NOT NULL,
    "pagePath" TEXT,
    "pageSlug" TEXT,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "noAnswer" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetrievalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "mode" "IngestionMode" NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'RUNNING',
    "targetDocumentId" TEXT,
    "summary" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexedDocument" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "contentType" "IndexedContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentHash" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "sourceMeta" JSONB NOT NULL,
    "lastIndexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestionRunId" TEXT,

    CONSTRAINT "IndexedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_sessionKey_key" ON "ChatSession"("sessionKey");

-- CreateIndex
CREATE INDEX "ChatSession_lastActiveAt_idx" ON "ChatSession"("lastActiveAt" DESC);

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AnswerFeedback_sessionId_createdAt_idx" ON "AnswerFeedback"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AnswerFeedback_messageId_idx" ON "AnswerFeedback"("messageId");

-- CreateIndex
CREATE INDEX "CitationClick_sessionId_createdAt_idx" ON "CitationClick"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "CitationClick_messageId_idx" ON "CitationClick"("messageId");

-- CreateIndex
CREATE INDEX "NoResultEvent_createdAt_idx" ON "NoResultEvent"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "NoResultEvent_pageSlug_idx" ON "NoResultEvent"("pageSlug");

-- CreateIndex
CREATE INDEX "RetrievalEvent_sessionId_createdAt_idx" ON "RetrievalEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "RetrievalEvent_pageSlug_createdAt_idx" ON "RetrievalEvent"("pageSlug", "createdAt");

-- CreateIndex
CREATE INDEX "IngestionRun_startedAt_idx" ON "IngestionRun"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "IngestionRun_status_startedAt_idx" ON "IngestionRun"("status", "startedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "IndexedDocument_documentId_key" ON "IndexedDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "IndexedDocument_url_key" ON "IndexedDocument"("url");

-- CreateIndex
CREATE INDEX "IndexedDocument_contentType_publishedAt_idx" ON "IndexedDocument"("contentType", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "IndexedDocument_slug_idx" ON "IndexedDocument"("slug");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerFeedback" ADD CONSTRAINT "AnswerFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerFeedback" ADD CONSTRAINT "AnswerFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationClick" ADD CONSTRAINT "CitationClick_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationClick" ADD CONSTRAINT "CitationClick_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoResultEvent" ADD CONSTRAINT "NoResultEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetrievalEvent" ADD CONSTRAINT "RetrievalEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetrievalEvent" ADD CONSTRAINT "RetrievalEvent_userMessageId_fkey" FOREIGN KEY ("userMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetrievalEvent" ADD CONSTRAINT "RetrievalEvent_assistantMessageId_fkey" FOREIGN KEY ("assistantMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexedDocument" ADD CONSTRAINT "IndexedDocument_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "IngestionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
