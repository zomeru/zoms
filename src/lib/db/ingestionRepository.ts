import { type IngestionMode, IngestionStatus, type Prisma } from "@/generated/prisma/client";

import { getPrismaClient } from "./prisma";
import { withDbRetry } from "./retry";

export interface IngestionRunInput {
  mode: IngestionMode;
  targetDocumentId?: string;
}

export const ingestionRepository = {
  async createIngestionRun(input: IngestionRunInput) {
    return await withDbRetry(
      () =>
        getPrismaClient().ingestionRun.create({
          data: {
            mode: input.mode,
            status: IngestionStatus.RUNNING,
            targetDocumentId: input.targetDocumentId
          }
        }),
      { label: "createIngestionRun" }
    );
  },

  async finishIngestionRun(input: {
    errorMessage?: string;
    id: string;
    status: IngestionStatus;
    summary?: Prisma.InputJsonValue;
  }) {
    return await withDbRetry(
      () =>
        getPrismaClient().ingestionRun.update({
          where: { id: input.id },
          data: {
            errorMessage: input.errorMessage,
            finishedAt: new Date(),
            status: input.status,
            summary: input.summary
          }
        }),
      { label: "finishIngestionRun" }
    );
  }
};
