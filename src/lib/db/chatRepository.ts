import type { ChatMessageRole, Prisma } from "@/generated/prisma/client";
import log from "@/lib/logger";
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

export interface CreateUserTurnInput {
  blogSlugHint?: string;
  pathnameHint?: string;
  question: string;
  sessionKey: string;
}

export interface CreateAssistantReplyWithRetrievalEventInput {
  citations?: Prisma.InputJsonValue;
  content: string;
  groundedAnswer?: Prisma.InputJsonValue;
  matchCount?: number;
  noAnswer?: boolean;
  payload: Prisma.InputJsonValue;
  query: string;
  sessionId: string;
  userMessageId: string;
}

export const chatRepository = {
  async createChatMessage(input: ChatMessageInput) {
    let vectorStr: string | null = null;
    try {
      const embedding = await generateEmbedding(input.content);
      vectorStr = `[${embedding.join(",")}]`;
    } catch (err) {
      log.warn("[createChatMessage] embedding generation failed, proceeding without embedding", {
        error: err instanceof Error ? err.message : String(err)
      });
    }

    if (vectorStr !== null) {
      const vec = vectorStr;
      return await withDbRetry(
        () =>
          getPrismaClient().$transaction(async (tx) => {
            const message = await tx.chatMessage.create({ data: input, select: { id: true } });
            await tx.$executeRawUnsafe(
              `UPDATE "ChatMessage" SET embedding = $1::halfvec WHERE id = $2`,
              vec,
              message.id
            );
            return message;
          }),
        { label: "createChatMessage" }
      );
    }

    return await withDbRetry(
      () => getPrismaClient().chatMessage.create({ data: input, select: { id: true } }),
      { label: "createChatMessage" }
    );
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
        getPrismaClient().$queryRawUnsafe<
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
           ORDER BY cm.embedding <=> $2::halfvec
           LIMIT $3`,
          input.sessionKey,
          vectorStr,
          input.limit
        ),
      { label: "searchChatMessages" }
    );

    return rows
      .map((row) => ({
        content: row.content,
        createdAt: row.createdAt,
        id: row.id,
        role: row.role as ChatMessageRole
      }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  async getChatSession(sessionKey: string) {
    return await withDbRetry(
      () =>
        getPrismaClient().chatSession.findUnique({
          where: { sessionKey },
          select: {
            id: true,
            sessionKey: true,
            pathnameHint: true,
            blogSlugHint: true,
            createdAt: true,
            lastActiveAt: true,
            messages: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                role: true,
                content: true,
                citations: true,
                groundedAnswer: true,
                createdAt: true
              }
            }
          }
        }),
      { label: "getChatSession" }
    );
  },

  async getChatHistoryPage(sessionKey: string, input: { limit: number; offset: number }) {
    const where = { session: { sessionKey } } as const;
    const select = {
      id: true,
      role: true,
      content: true,
      citations: true,
      groundedAnswer: true,
      createdAt: true
    } as const;

    return await withDbRetry(
      () =>
        getPrismaClient().$transaction([
          getPrismaClient().chatMessage.findMany({
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select,
            skip: input.offset,
            take: input.limit,
            where
          }),
          getPrismaClient().chatMessage.count({ where })
        ]),
      { label: "getChatHistoryPage" }
    ).then(([messages, total]) => ({
      hasMore: input.offset + messages.length < total,
      messages: messages.reverse(),
      total
    }));
  },

  async getRecentChatMessages(sessionKey: string, limit: number) {
    const messages = await withDbRetry(
      () =>
        getPrismaClient().chatMessage.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            role: true,
            content: true,
            citations: true,
            groundedAnswer: true,
            createdAt: true
          },
          take: limit,
          where: { session: { sessionKey } }
        }),
      { label: "getRecentChatMessages" }
    );

    return messages.reverse();
  },

  async touchChatSession(input: ChatSessionInput) {
    return await withDbRetry(
      () =>
        getPrismaClient().chatSession.upsert({
          where: { sessionKey: input.sessionKey },
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
          },
          select: { id: true }
        }),
      { label: "touchChatSession" }
    );
  },

  async createUserTurn(input: CreateUserTurnInput) {
    return await withDbRetry(
      () =>
        getPrismaClient().$transaction(async (tx) => {
          const session = await tx.chatSession.upsert({
            where: { sessionKey: input.sessionKey },
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
            },
            select: { id: true }
          });

          const userMessage = await tx.chatMessage.create({
            data: {
              content: input.question,
              role: "USER",
              sessionId: session.id
            },
            select: { id: true }
          });

          return { sessionId: session.id, userMessageId: userMessage.id };
        }),
      { label: "createUserTurn" }
    );
  },

  async createAssistantReplyWithRetrievalEvent(input: CreateAssistantReplyWithRetrievalEventInput) {
    let vectorStr: string | null = null;
    try {
      const embedding = await generateEmbedding(input.content);
      vectorStr = `[${embedding.join(",")}]`;
    } catch (err) {
      log.warn(
        "[createAssistantReplyWithRetrievalEvent] embedding generation failed, proceeding without embedding",
        {
          error: err instanceof Error ? err.message : String(err)
        }
      );
    }

    return await withDbRetry(
      () =>
        getPrismaClient().$transaction(async (tx) => {
          const assistantMessage = await tx.chatMessage.create({
            data: {
              citations: input.citations,
              content: input.content,
              groundedAnswer: input.groundedAnswer,
              role: "ASSISTANT",
              sessionId: input.sessionId
            },
            select: { id: true }
          });

          if (vectorStr !== null) {
            await tx.$executeRawUnsafe(
              `UPDATE "ChatMessage" SET embedding = $1::halfvec WHERE id = $2`,
              vectorStr,
              assistantMessage.id
            );
          }

          await tx.retrievalEvent.create({
            data: {
              assistantMessageId: assistantMessage.id,
              matchCount: input.matchCount ?? 0,
              noAnswer: input.noAnswer ?? false,
              payload: input.payload,
              query: input.query,
              sessionId: input.sessionId,
              userMessageId: input.userMessageId
            }
          });

          return assistantMessage;
        }),
      { label: "createAssistantReplyWithRetrievalEvent" }
    );
  }
};
