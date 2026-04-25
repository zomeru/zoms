import type { Prisma } from "@/generated/prisma/client";

import { getPrismaClient } from "./prisma";
import { withDbRetry } from "./retry";

export const retrievalRepository = {
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
    return await withDbRetry(
      () =>
        getPrismaClient().retrievalEvent.create({
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
        }),
      { label: "createRetrievalEvent" }
    );
  }
};
