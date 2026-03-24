import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkBotId = vi.fn();
const repositories = {
  getChatHistoryPage: vi.fn()
};

vi.mock('botid/server', () => ({
  checkBotId
}));

vi.mock('@/lib/db/repositories', () => ({
  repositories
}));

vi.mock('@/lib/ai/chat', () => ({
  streamGeneralAnswer: vi.fn(),
  streamGroundedAnswer: vi.fn()
}));

vi.mock('@/lib/ai/directAnswers', () => ({
  getDirectAssistantAnswer: vi.fn()
}));

vi.mock('@/lib/ai/responseDecorations', () => ({
  filterChatCitations: (input: { citations: unknown[] }) => input.citations
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimitMiddleware: vi.fn()
}));

vi.mock('@/lib/retrieval/classify', () => ({
  classifyQueryIntent: vi.fn()
}));

vi.mock('@/lib/retrieval/search', () => ({
  retrieveBlogs: vi.fn(),
  retrieveExperience: vi.fn(),
  retrievePortfolio: vi.fn(),
  retrieveProjects: vi.fn()
}));

vi.mock('@/lib/vector/index', () => ({
  getVectorIndexClient: vi.fn()
}));

describe('AI chat history route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: false,
      isHuman: true,
      isVerifiedBot: false
    });
  });

  it('returns the newest history page first and supports older-message pagination', async () => {
    repositories.getChatHistoryPage
      .mockResolvedValueOnce({
        hasMore: true,
        messages: [
          {
            citations: null,
            content: 'Recent question',
            groundedAnswer: null,
            id: 'user-recent',
            role: 'USER'
          },
          {
            citations: [],
            content: 'Recent answer',
            groundedAnswer: {
              supported: true
            },
            id: 'assistant-recent',
            role: 'ASSISTANT'
          }
        ],
        total: 4
      })
      .mockResolvedValueOnce({
        hasMore: false,
        messages: [
          {
            citations: null,
            content: 'Older question',
            groundedAnswer: null,
            id: 'user-older',
            role: 'USER'
          },
          {
            citations: [],
            content: 'Older answer',
            groundedAnswer: {
              supported: true
            },
            id: 'assistant-older',
            role: 'ASSISTANT'
          }
        ],
        total: 4
      });

    const { GET } = await import('@/app/api/ai/chat/route');

    const newestPageResponse = await GET(
      new NextRequest('http://localhost/api/ai/chat?sessionKey=session-key&limit=2&offset=0')
    );

    expect(newestPageResponse.status).toBe(200);
    expect(await newestPageResponse.json()).toEqual({
      hasMore: true,
      limit: 2,
      messages: [
        {
          content: 'Recent question',
          id: 'user-recent',
          role: 'user'
        },
        {
          citations: [],
          content: 'Recent answer',
          id: 'assistant-recent',
          messageId: 'assistant-recent',
          role: 'assistant',
          supported: true
        }
      ],
      offset: 0,
      sessionKey: 'session-key',
      total: 4
    });

    const olderPageResponse = await GET(
      new NextRequest('http://localhost/api/ai/chat?sessionKey=session-key&limit=2&offset=2')
    );

    expect(olderPageResponse.status).toBe(200);
    expect(await olderPageResponse.json()).toEqual({
      hasMore: false,
      limit: 2,
      messages: [
        {
          content: 'Older question',
          id: 'user-older',
          role: 'user'
        },
        {
          citations: [],
          content: 'Older answer',
          id: 'assistant-older',
          messageId: 'assistant-older',
          role: 'assistant',
          supported: true
        }
      ],
      offset: 2,
      sessionKey: 'session-key',
      total: 4
    });

    expect(repositories.getChatHistoryPage).toHaveBeenNthCalledWith(1, 'session-key', {
      limit: 2,
      offset: 0
    });
    expect(repositories.getChatHistoryPage).toHaveBeenNthCalledWith(2, 'session-key', {
      limit: 2,
      offset: 2
    });
  });
});
