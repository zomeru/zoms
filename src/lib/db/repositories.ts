import {
  type ChatMessageRole,
  type IndexedContentType,
  type IngestionMode,
  IngestionStatus,
  type Prisma
} from "@/generated/prisma/client";
import { generateEmbedding } from "@/lib/vector/index";

import { getPrismaClient } from "./prisma";
import { withDbRetry } from "./retry";

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
  async createChatMessage(input: ChatMessageInput) {
    const message = await getDb().chatMessage.create({
      data: input
    });

    // Fire-and-forget embedding so retrieval doesn't block the response stream.
    // Failures are swallowed — a message without an embedding simply won't surface in
    // future semantic searches.
    void (async () => {
      try {
        const embedding = await generateEmbedding(input.content);
        const vectorStr = `[${embedding.join(",")}]`;
        await withDbRetry(
          () =>
            getDb().$executeRawUnsafe(
              `UPDATE "ChatMessage" SET embedding = $1::vector WHERE id = $2`,
              vectorStr,
              message.id
            ),
          { label: "embedChatMessage" }
        );
      } catch (err) {
        console.warn(
          "[embedChatMessage] failed:",
          err instanceof Error ? err.message : String(err)
        );
      }
    })();

    return message;
  },

  async searchChatMessages(input: { limit: number; query: string; sessionKey: string }): Promise<
    Array<{
      content: string;
      createdAt: Date;
      id: string;
      role: ChatMessageRole;
    }>
  > {
    if (input.sessionKey.length === 0) return [];

    const embedding = await generateEmbedding(input.query);
    const vectorStr = `[${embedding.join(",")}]`;

    const rows = await withDbRetry(
      () =>
        getDb().$queryRawUnsafe<
          Array<{
            content: string;
            createdAt: Date;
            id: string;
            role: string;
          }>
        >(
          `SELECT cm.id, cm.role::text AS role, cm.content, cm."createdAt"
           FROM "ChatMessage" cm
           JOIN "ChatSession" cs ON cs.id = cm."sessionId"
           WHERE cs."sessionKey" = $1
             AND cm.embedding IS NOT NULL
           ORDER BY cm.embedding <=> $2::vector
           LIMIT $3`,
          input.sessionKey,
          vectorStr,
          input.limit
        ),
      { label: "searchChatMessages" }
    );

    // Order by createdAt ascending so the conversation reads chronologically in the prompt.
    return rows
      .map((row) => ({
        content: row.content,
        createdAt: row.createdAt,
        id: row.id,
        role: row.role as ChatMessageRole
      }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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
            createdAt: "asc"
          }
        }
      }
    });
  },

  async getChatHistoryPage(sessionKey: string, input: { limit: number; offset: number }) {
    const where = {
      session: {
        sessionKey
      }
    } as const;

    const [messages, total] = await Promise.all([
      getDb().chatMessage.findMany({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        skip: input.offset,
        take: input.limit,
        where
      }),
      getDb().chatMessage.count({
        where
      })
    ]);

    return {
      hasMore: input.offset + messages.length < total,
      messages: messages.reverse(),
      total
    };
  },

  async getRecentChatMessages(sessionKey: string, limit: number) {
    const messages = await getDb().chatMessage.findMany({
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      take: limit,
      where: {
        session: {
          sessionKey
        }
      }
    });

    return messages.reverse();
  },

  async getIndexedDocument(documentId: string) {
    return await getDb().indexedDocument.findUnique({
      where: {
        documentId
      }
    });
  },

  async listIndexedDocumentHashes(): Promise<Map<string, string>> {
    const rows = await getDb().indexedDocument.findMany({
      select: {
        contentHash: true,
        documentId: true
      }
    });
    return new Map(rows.map((row) => [row.documentId, row.contentHash]));
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
