import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const checkBotId = vi.fn();
const isValidAiReindexSession = vi.fn();
const isValidBlogGenerationSession = vi.fn();

vi.mock('botid/server', () => ({
  checkBotId
}));

vi.mock('@/lib/ai/reindexAuth', () => ({
  isValidAiReindexSession
}));

vi.mock('@/lib/blogGenerationAuth', () => ({
  isValidBlogGenerationSession
}));

describe('admin access route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns current admin authorization state when BotID allows the request', async () => {
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: false,
      isHuman: true,
      isVerifiedBot: false
    });
    isValidBlogGenerationSession.mockReturnValue(true);
    isValidAiReindexSession.mockReturnValue(false);

    const { GET } = await import('@/app/api/admin/access/route');

    const response = await GET(new NextRequest('http://localhost/api/admin/access'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      aiReindexAuthorized: false,
      blogGenerationAuthorized: true,
      success: true
    });
  });
});
