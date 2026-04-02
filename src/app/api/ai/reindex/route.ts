import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAiReindexSessionCookie, isAuthorizedAiReindexRequest } from "@/lib/ai/reindexAuth";
import { verifyBotIdRequest } from "@/lib/botId";
import { handleApiError, validateSchema } from "@/lib/errorHandler";
import { runSiteReindex } from "@/lib/ingestion/reindex";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const reindexRequestSchema = z.object({
  documentId: z.string().trim().optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const botIdResponse = await verifyBotIdRequest(request, {
    allowAuthorizedServiceRequest: true
  });

  if (botIdResponse) {
    return botIdResponse;
  }

  const rateLimitResponse = await rateLimitMiddleware(request, "AI_REINDEX");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    if (!isAuthorizedAiReindexRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body =
      request.headers.get("content-length") === "0" ? {} : ((await request.json()) as unknown);
    const input = validateSchema(reindexRequestSchema, body);
    const result = await runSiteReindex({
      documentId: input.documentId
    });
    const response = NextResponse.json(result);

    if (request.headers.get("authorization")) {
      const cookie = getAiReindexSessionCookie();
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    return response;
  } catch (error) {
    return handleApiError(error, {
      method: request.method,
      path: request.nextUrl.pathname
    });
  }
}
