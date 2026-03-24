import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkBotId = vi.fn();
const rateLimitMiddleware = vi.fn();
const repositories = {
  createChatMessage: vi.fn(),
  createRetrievalEvent: vi.fn(),
  touchChatSession: vi.fn()
};
const retrieveBlogs = vi.fn();
const getDirectAssistantAnswer = vi.fn();
const streamGeneralAnswer = vi.fn();
const streamGroundedAnswer = vi.fn();

vi.mock('botid/server', () => ({
  checkBotId
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimitMiddleware
}));

vi.mock('@/lib/db/repositories', () => ({
  repositories
}));

vi.mock('@/lib/retrieval/search', () => ({
  retrieveBlogs,
  retrieveExperience: vi.fn(),
  retrievePortfolio: vi.fn(),
  retrieveProjects: vi.fn()
}));

vi.mock('@/lib/ai/chat', () => ({
  streamGeneralAnswer,
  streamGroundedAnswer
}));

vi.mock('@/lib/ai/directAnswers', () => ({
  getDirectAssistantAnswer
}));

vi.mock('@/lib/vector/index', () => ({
  getVectorIndexClient: () => ({
    query: vi.fn()
  })
}));

describe('general knowledge chat route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: false,
      isHuman: true,
      isVerifiedBot: false
    });
    rateLimitMiddleware.mockResolvedValue(null);
    repositories.touchChatSession.mockResolvedValue({
      id: 'session-db-id',
      sessionKey: 'session-key'
    });
    repositories.createChatMessage.mockResolvedValue({ id: 'message-id' });
    repositories.createRetrievalEvent.mockResolvedValue({ id: 'retrieval-id' });
    getDirectAssistantAnswer.mockResolvedValue(null);
    retrieveBlogs.mockResolvedValue({
      citations: [],
      classification: {
        intent: 'BLOG_QUERY',
        preferredContentTypes: ['blog'],
        query: 'What is Rust programming language?',
        strictContentTypes: true,
        tokens: ['what', 'is', 'rust', 'programming', 'language']
      },
      matches: [],
      shouldRefuse: false
    });
    streamGeneralAnswer.mockResolvedValue({
      citations: [],
      supported: true,
      textStream: (async function* () {
        yield 'Rust is ';
        yield 'a systems programming language.';
      })()
    });
  });

  it('answers general knowledge questions without portfolio-only grounding', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');

    const response = await POST(
      new NextRequest('http://localhost/api/ai/chat', {
        body: JSON.stringify({
          question: 'What is Rust programming language?'
        }),
        method: 'POST'
      })
    );

    expect(response.status).toBe(200);
    expect(streamGeneralAnswer).toHaveBeenCalledTimes(1);
    expect(streamGroundedAnswer).not.toHaveBeenCalled();

    const body = await response.text();
    expect(body).toContain('Rust is a systems programming language.');
  });
});
