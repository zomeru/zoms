import "server-only";

import { after } from "next/server";

import { runSiteReindex } from "@/lib/ingestion/reindex";
import log from "@/lib/logger";

type PostResponseScheduler = (callback: () => void | Promise<void>) => void;

export function scheduleBlogReindex(
  slug: string,
  schedulePostResponseWork: PostResponseScheduler = after
): void {
  schedulePostResponseWork(async () => {
    try {
      await runSiteReindex({
        documentId: `blog:${slug}`
      });
      log.info("Targeted blog reindex completed after generation", {
        documentId: `blog:${slug}`,
        slug
      });
    } catch (error) {
      log.error("Targeted blog reindex failed after generation", {
        documentId: `blog:${slug}`,
        error: error instanceof Error ? error.message : String(error),
        slug
      });
    }
  });
}
