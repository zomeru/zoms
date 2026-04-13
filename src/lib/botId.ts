import { checkBotId } from "botid/server";
import { type NextRequest, NextResponse } from "next/server";

import log from "./logger";

export interface BotIdProtectedRoute {
  method: string;
  path: string;
}

export const BOTID_PROTECTED_ROUTES: BotIdProtectedRoute[] = [
  { path: "/api/*", method: "GET" },
  { path: "/api/*", method: "POST" },
  { path: "/api/*", method: "PUT" },
  { path: "/api/*", method: "PATCH" },
  { path: "/api/*", method: "DELETE" }
];

interface VerifyBotIdRequestOptions {
  allowAuthorizedServiceRequest?: boolean;
}

export async function verifyBotIdRequest(
  request: NextRequest,
  options: VerifyBotIdRequestOptions = {}
): Promise<NextResponse | null> {
  if (options.allowAuthorizedServiceRequest && request.headers.has("authorization")) {
    return null;
  }

  let verification: Awaited<ReturnType<typeof checkBotId>>;
  try {
    verification = await checkBotId();
  } catch (error) {
    log.warn("BotId check failed, allowing request through", {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }

  if (!verification.isBot || verification.isVerifiedBot) {
    return null;
  }

  return NextResponse.json({ error: "Bot detected. Access denied." }, { status: 403 });
}
