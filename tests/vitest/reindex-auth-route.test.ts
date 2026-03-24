import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const checkBotId = vi.fn();
const getAiReindexSessionCookie = vi.fn();
const getClearedAiReindexSessionCookie = vi.fn();
const hasAiReindexSecret = vi.fn();
const validateAiReindexSecret = vi.fn();
const log = {
  error: vi.fn()
};

vi.mock('botid/server', () => ({
  checkBotId
}));

vi.mock('@/lib/ai/reindexAuth', () => ({
  getAiReindexSessionCookie,
  getClearedAiReindexSessionCookie,
  hasAiReindexSecret,
  validateAiReindexSecret
}));

vi.mock('@/lib/logger', () => ({
  default: log
}));

describe('AI reindex auth route', () => {
  beforeEach(() => {
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: false,
      isHuman: true,
      isVerifiedBot: false
    });
    hasAiReindexSecret.mockReturnValue(true);
    validateAiReindexSecret.mockReturnValue(true);
    getAiReindexSessionCookie.mockReturnValue({
      name: 'ai_reindex_session',
      options: {
        httpOnly: true,
        path: '/',
        sameSite: 'lax'
      },
      value: 'signed'
    });
    getClearedAiReindexSessionCookie.mockReturnValue({
      name: 'ai_reindex_session',
      options: {
        httpOnly: true,
        maxAge: 0,
        path: '/',
        sameSite: 'lax'
      },
      value: ''
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('authorizes and clears manual reindex sessions with the dedicated auth route', async () => {
    const { DELETE, POST } = await import('@/app/api/ai/reindex/auth/route');

    validateAiReindexSecret.mockReturnValueOnce(false);

    const unauthorized = await POST(
      new NextRequest('http://localhost/api/ai/reindex/auth', {
        body: JSON.stringify({ secret: 'wrong' }),
        method: 'POST'
      })
    );

    expect(unauthorized.status).toBe(401);
    expect(log.error).toHaveBeenCalledWith(
      'API Error',
      expect.objectContaining({
        code: 'UNAUTHORIZED',
        path: '/api/ai/reindex/auth',
        statusCode: 401
      })
    );

    const authorized = await POST(
      new NextRequest('http://localhost/api/ai/reindex/auth', {
        body: JSON.stringify({ secret: 'correct' }),
        method: 'POST'
      })
    );

    expect(authorized.status).toBe(200);
    expect(getAiReindexSessionCookie).toHaveBeenCalledTimes(1);

    const cleared = await DELETE(new NextRequest('http://localhost/api/ai/reindex/auth'));

    expect(cleared.status).toBe(200);
    expect(getClearedAiReindexSessionCookie).toHaveBeenCalledTimes(1);
  });
});
