import {
  IngestionStatus,
  type ChatMessageRole,
  type FeedbackValue,
  type IndexedContentType,
  type IngestionMode,
  type Prisma
} from '@prisma/client';

import { getPrismaClient } from './prisma';

export interface ChatSessionInput {
  blogSlugHint?: string;
  pathnameHint?: string;
  sessionKey: string;
}

export interface ChatMessageInput {
  citations?: Prisma.InputJsonValue;
  content: string;
  groundedAnswer?: Prisma.InputJsonValue;
  model?: string;
  providerMessageId?: string;
  relatedContent?: Prisma.InputJsonValue;
  role: ChatMessageRole;
  sessionId: string;
  transformMode?: string;
}

export interface IngestionRunInput {
  mode: IngestionMode;
  targetDocumentId?: string;
}

export interface IndexedDocumentInput {
  chunkCount: number;
  contentHash: string;
  contentType: IndexedContentType;
  documentId: string;
  ingestionRunId?: string;
  lastIndexedAt?: Date;
  publishedAt?: Date;
  slug?: string;
  sourceMeta: Prisma.InputJsonValue;
  tags?: string[];
  title: string;
  url: string;
}

function getDb() {
  return getPrismaClient();
}

export const repositories = {
  async createAnswerFeedback(input: {
    messageId?: string;
    payload?: Prisma.InputJsonValue;
    sessionId: string;
    value: FeedbackValue;
  }) {
    return await getDb().answerFeedback.create({
      data: input
    });
  },

  async createCitationClick(input: {
    citationId: string;
    messageId?: string;
    payload?: Prisma.InputJsonValue;
    sessionId: string;
    url: string;
  }) {
    return await getDb().citationClick.create({
      data: input
    });
  },

  async createChatMessage(input: ChatMessageInput) {
    return await getDb().chatMessage.create({
      data: input
    });
  },

  async createIngestionRun(input: IngestionRunInput) {
    return await getDb().ingestionRun.create({
      data: {
        mode: input.mode,
        status: IngestionStatus.RUNNING,
        targetDocumentId: input.targetDocumentId
      }
    });
  },

  async createNoResultEvent(input: {
    pagePath?: string;
    pageSlug?: string;
    payload?: Prisma.InputJsonValue;
    question: string;
    sessionId?: string;
  }) {
    return await getDb().noResultEvent.create({
      data: input
    });
  },

  async createRetrievalEvent(input: {
    assistantMessageId?: string;
    matchCount?: number;
    noAnswer?: boolean;
    pagePath?: string;
    pageSlug?: string;
    payload: Prisma.InputJsonValue;
    query: string;
    sessionId?: string;
    userMessageId?: string;
  }) {
    return await getDb().retrievalEvent.create({
      data: {
        assistantMessageId: input.assistantMessageId,
        matchCount: input.matchCount ?? 0,
        noAnswer: input.noAnswer ?? false,
        pagePath: input.pagePath,
        pageSlug: input.pageSlug,
        payload: input.payload,
        query: input.query,
        sessionId: input.sessionId,
        userMessageId: input.userMessageId
      }
    });
  },

  async finishIngestionRun(input: {
    errorMessage?: string;
    id: string;
    status: IngestionStatus;
    summary?: Prisma.InputJsonValue;
  }) {
    return await getDb().ingestionRun.update({
      where: {
        id: input.id
      },
      data: {
        errorMessage: input.errorMessage,
        finishedAt: new Date(),
        status: input.status,
        summary: input.summary
      }
    });
  },

  async deleteIndexedDocument(documentId: string) {
    await getDb().indexedDocument.deleteMany({
      where: {
        documentId
      }
    });
  },

  async getChatSession(sessionKey: string) {
    return await getDb().chatSession.findUnique({
      where: {
        sessionKey
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
  },

  async getIndexedDocument(documentId: string) {
    return await getDb().indexedDocument.findUnique({
      where: {
        documentId
      }
    });
  },

  async touchChatSession(input: ChatSessionInput) {
    return await getDb().chatSession.upsert({
      where: {
        sessionKey: input.sessionKey
      },
      update: {
        blogSlugHint: input.blogSlugHint,
        lastActiveAt: new Date(),
        pathnameHint: input.pathnameHint
      },
      create: {
        blogSlugHint: input.blogSlugHint,
        lastActiveAt: new Date(),
        pathnameHint: input.pathnameHint,
        sessionKey: input.sessionKey
      }
    });
  },

  async upsertIndexedDocument(input: IndexedDocumentInput) {
    return await getDb().indexedDocument.upsert({
      where: {
        documentId: input.documentId
      },
      update: {
        chunkCount: input.chunkCount,
        contentHash: input.contentHash,
        contentType: input.contentType,
        ingestionRunId: input.ingestionRunId,
        lastIndexedAt: input.lastIndexedAt ?? new Date(),
        publishedAt: input.publishedAt,
        slug: input.slug,
        sourceMeta: input.sourceMeta,
        tags: input.tags ?? [],
        title: input.title,
        url: input.url
      },
      create: {
        chunkCount: input.chunkCount,
        contentHash: input.contentHash,
        contentType: input.contentType,
        documentId: input.documentId,
        ingestionRunId: input.ingestionRunId,
        lastIndexedAt: input.lastIndexedAt ?? new Date(),
        publishedAt: input.publishedAt,
        slug: input.slug,
        sourceMeta: input.sourceMeta,
        tags: input.tags ?? [],
        title: input.title,
        url: input.url
      }
    });
  }
};
