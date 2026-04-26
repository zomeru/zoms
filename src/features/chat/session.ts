import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

import { AI_CHAT_COOKIE_NAME } from "@/lib/ai/chat/schemas";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getSessionKey(request: NextRequest): { isNew: boolean; sessionKey: string } {
  const existing = request.cookies.get(AI_CHAT_COOKIE_NAME)?.value;

  if (existing && UUID_RE.test(existing)) {
    return { isNew: false, sessionKey: existing };
  }

  return { isNew: true, sessionKey: randomUUID() };
}
