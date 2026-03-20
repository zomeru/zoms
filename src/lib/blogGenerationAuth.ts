import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const BLOG_GENERATION_COOKIE_NAME = 'blog_generation_session';
const BLOG_GENERATION_COOKIE_PAYLOAD = 'blog-generator-session:v1';
const BLOG_GENERATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function getConfiguredSecret(): string | null {
  return process.env.BLOG_GENERATION_SECRET ?? process.env.CRON_SECRET ?? null;
}

function createSessionValue(secret: string): string {
  return createHmac('sha256', secret).update(BLOG_GENERATION_COOKIE_PAYLOAD).digest('hex');
}

export function hasBlogGenerationSecret(): boolean {
  return getConfiguredSecret() !== null;
}

export function validateBlogGenerationSecret(secret: string): boolean {
  const configuredSecret = getConfiguredSecret();
  if (!configuredSecret) return false;

  const inputBuffer = Buffer.from(secret);
  const configuredBuffer = Buffer.from(configuredSecret);

  if (inputBuffer.length !== configuredBuffer.length) return false;

  return timingSafeEqual(inputBuffer, configuredBuffer);
}

export function isValidBlogGenerationSession(
  cookieStore: Pick<ReadonlyRequestCookies, 'get'>
): boolean {
  const configuredSecret = getConfiguredSecret();
  if (!configuredSecret) return false;

  const cookieValue = cookieStore.get(BLOG_GENERATION_COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  const expectedValue = createSessionValue(configuredSecret);
  const actualBuffer = Buffer.from(cookieValue);
  const expectedBuffer = Buffer.from(expectedValue);

  if (actualBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function getBlogGenerationSessionCookie() {
  const configuredSecret = getConfiguredSecret();
  if (!configuredSecret) {
    throw new Error('BLOG_GENERATION_SECRET is not configured');
  }

  return {
    name: BLOG_GENERATION_COOKIE_NAME,
    value: createSessionValue(configuredSecret),
    options: {
      httpOnly: true,
      maxAge: BLOG_GENERATION_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production'
    }
  };
}

export function getClearedBlogGenerationSessionCookie() {
  return {
    name: BLOG_GENERATION_COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      maxAge: 0,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production'
    }
  };
}
