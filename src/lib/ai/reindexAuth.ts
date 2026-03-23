import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { NextRequest } from 'next/server';

const AI_REINDEX_COOKIE_NAME = 'ai_reindex_session';
const AI_REINDEX_COOKIE_PAYLOAD = 'ai-reindex-session:v1';
const AI_REINDEX_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function getConfiguredSecret(): string | null {
  return process.env.AI_REINDEX_SECRET ?? null;
}

function createSessionValue(secret: string): string {
  return createHmac('sha256', secret).update(AI_REINDEX_COOKIE_PAYLOAD).digest('hex');
}

export function validateAiReindexSecret(secret: string): boolean {
  const configuredSecret = getConfiguredSecret();

  if (!configuredSecret) {
    return false;
  }

  const providedBuffer = Buffer.from(secret);
  const configuredBuffer = Buffer.from(configuredSecret);

  if (providedBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, configuredBuffer);
}

export function isValidAiReindexSession(cookieStore: Pick<ReadonlyRequestCookies, 'get'>): boolean {
  const configuredSecret = getConfiguredSecret();

  if (!configuredSecret) {
    return false;
  }

  const cookieValue = cookieStore.get(AI_REINDEX_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return false;
  }

  const expectedValue = createSessionValue(configuredSecret);
  const actualBuffer = Buffer.from(cookieValue);
  const expectedBuffer = Buffer.from(expectedValue);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isAuthorizedAiReindexRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  return (
    (bearerSecret ? validateAiReindexSecret(bearerSecret) : false) ||
    isValidAiReindexSession(request.cookies)
  );
}

export function getAiReindexSessionCookie() {
  const configuredSecret = getConfiguredSecret();

  if (!configuredSecret) {
    throw new Error('AI_REINDEX_SECRET is not configured');
  }

  return {
    name: AI_REINDEX_COOKIE_NAME,
    options: {
      httpOnly: true,
      maxAge: AI_REINDEX_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production'
    },
    value: createSessionValue(configuredSecret)
  };
}
