import { type NextRequest, NextResponse } from "next/server";

import { isValidAiReindexSession } from "@/lib/ai/reindexAuth";
import { isValidBlogGenerationSession } from "@/lib/blogGenerationAuth";
import { verifyBotIdRequest } from "@/lib/botId";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const botIdResponse = await verifyBotIdRequest(request);

  if (botIdResponse) {
    return botIdResponse;
  }

  return NextResponse.json({
    aiReindexAuthorized: isValidAiReindexSession(request.cookies),
    blogGenerationAuthorized: isValidBlogGenerationSession(request.cookies),
    success: true
  });
}
