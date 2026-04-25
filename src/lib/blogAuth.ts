import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

import { isValidBlogGenerationSession } from "@/lib/blogGenerationAuth";
import { ApiError } from "@/lib/errorHandler";
import { getErrorMessage } from "@/lib/errorMessages";
import log from "@/lib/logger";

function safeBearerEquals(header: string | null, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function requireBlogGenerationAuth(request: NextRequest): Promise<void> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const blogGenerationSecret = process.env.BLOG_GENERATION_SECRET ?? cronSecret;
  const hasValidCookie = isValidBlogGenerationSession(request.cookies);

  if (
    hasValidCookie ||
    safeBearerEquals(authHeader, cronSecret) ||
    safeBearerEquals(authHeader, blogGenerationSecret)
  ) {
    return;
  }

  log.warn("Unauthorized blog auth attempt", {
    hasAuthHeader: !!authHeader,
    hasCookie: hasValidCookie
  });
  throw new ApiError(getErrorMessage("UNAUTHORIZED"), 401, "UNAUTHORIZED");
}
