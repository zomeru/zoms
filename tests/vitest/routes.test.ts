import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface RetrievalCallInput {
  query: string;
}

interface GroundedAnswerCallInput {
  conversationHistory: Array<{
    content: string;
    role: 'assistant' | 'user';
  }>;
}

function isRetrievalCallInput(value: unknown): value is RetrievalCallInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    'query' in value &&
    typeof value.query === 'string'
  );
}

function isGroundedAnswerCallInput(value: unknown): value is GroundedAnswerCallInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    'conversationHistory' in value &&
    Array.isArray(value.conversationHistory)
  );
}

const rateLimitMiddleware = vi.fn();
const repositories = {
  createAnswerFeedback: vi.fn(),
  createChatMessage: vi.fn(),
  createCitationClick: vi.fn(),
  createNoResultEvent: vi.fn(),
  createRetrievalEvent: vi.fn(),
  getChatSession: vi.fn(),
  touchChatSession: vi.fn()
};
const retrieveRelevantChunks = vi.fn();
const retrieveBlogs = retrieveRelevantChunks;
const retrieveExperience = retrieveRelevantChunks;
const retrievePortfolio = retrieveRelevantChunks;
const retrieveProjects = retrieveRelevantChunks;
const getDirectAssistantAnswer = vi.fn();
const buildRelatedContent = vi.fn();
const streamGroundedAnswer = vi.fn();
const generateBlogTransform = vi.fn();
const runSiteReindex = vi.fn();
const withQueryCache = vi.fn();
const getBlogPostBySlug = vi.fn();
const isAuthorizedAiReindexRequest = vi.fn();
const getAiReindexSessionCookie = vi.fn();

vi.mock('@/lib/rateLimit', () => ({
  rateLimitMiddleware
}));

vi.mock('@/lib/db/repositories', () => ({
  repositories
}));

vi.mock('@/lib/retrieval/search', () => ({
  retrieveBlogs,
  retrieveExperience,
  retrievePortfolio,
  retrieveProjects,
  retrieveRelevantChunks
}));

vi.mock('@/lib/ai/directAnswers', () => ({
  getDirectAssistantAnswer
}));

vi.mock('@/lib/ai/chat', () => ({
  buildRelatedContent,
  streamGroundedAnswer
}));

vi.mock('@/lib/ai/transform', () => ({
  generateBlogTransform
}));

vi.mock('@/lib/ingestion/reindex', () => ({
  runSiteReindex
}));

vi.mock('@/lib/cache/queryCache', () => ({
  withQueryCache
}));

vi.mock('@/lib/blog', () => ({
  getBlogPostBySlug
}));

vi.mock('@/lib/ai/reindexAuth', () => ({
  getAiReindexSessionCookie,
  isAuthorizedAiReindexRequest
}));

describe('AI routes', () => {
  beforeEach(() => {
    rateLimitMiddleware.mockResolvedValue(null);
    repositories.touchChatSession.mockResolvedValue({
      id: 'session-db-id',
      sessionKey: 'session-key'
    });
    repositories.createChatMessage.mockResolvedValue({ id: 'message-id' });
    repositories.createRetrievalEvent.mockResolvedValue({ id: 'retrieval-id' });
    repositories.getChatSession.mockResolvedValue({
      id: 'session-db-id',
      sessionKey: 'session-key'
    });
    retrieveRelevantChunks.mockResolvedValue({
      citations: [
        {
          contentType: 'blog',
          id: 'citation-1',
          sectionTitle: 'Summary',
          snippet: 'deterministic retrieval',
          title: 'Grounded assistant',
          url: '/blog/grounded-assistant'
        }
      ],
      matches: [],
      shouldRefuse: false
    });
    getDirectAssistantAnswer.mockResolvedValue(null);
    buildRelatedContent.mockReturnValue([
      {
        contentType: 'project',
        reason: 'Relevant project connection',
        title: 'Batibot',
        url: '/#projects'
      }
    ]);
    streamGroundedAnswer.mockResolvedValue({
      citations: [
        {
          contentType: 'blog',
          id: 'citation-1',
          sectionTitle: 'Summary',
          snippet: 'deterministic retrieval',
          title: 'Grounded assistant',
          url: '/blog/grounded-assistant'
        }
      ],
      relatedContent: [
        {
          contentType: 'project',
          reason: 'Relevant project connection',
          title: 'Batibot',
          url: '/#projects'
        }
      ],
      supported: true,
      textStream: (async function* () {
        yield 'Grounded ';
        yield 'response text.';
      })()
    });
    generateBlogTransform.mockResolvedValue({
      bullets: ['Short summary'],
      mode: 'tldr',
      title: 'TL;DR',
      transformedText: 'Short transform text.'
    });
    withQueryCache.mockImplementation(
      async (_key: string, loader: () => Promise<unknown>) => await loader()
    );
    getBlogPostBySlug.mockResolvedValue({
      body: '# Post body',
      slug: { current: 'grounded-assistant' },
      summary: 'Summary',
      title: 'Grounded assistant'
    });
    isAuthorizedAiReindexRequest.mockReturnValue(true);
    getAiReindexSessionCookie.mockReturnValue({
      name: 'ai_reindex_session',
      options: {
        httpOnly: true,
        path: '/',
        sameSite: 'lax'
      },
      value: 'signed'
    });
    runSiteReindex.mockResolvedValue({
      processed: 3,
      runId: 'run-id',
      skipped: 1,
      updated: 2
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a chat session, validates the request, and streams a grounded answer', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');

    const response = await POST(
      new NextRequest('http://localhost/api/ai/chat', {
        body: JSON.stringify({
          blogSlug: 'grounded-assistant',
          pathname: '/blog/grounded-assistant',
          question: 'How does the assistant stay grounded?'
        }),
        method: 'POST'
      })
    );

    expect(response.status).toBe(200);
    expect(repositories.touchChatSession).toHaveBeenCalledTimes(1);
    expect(response.headers.get('set-cookie')).toContain('ai_chat_session=');

    const body = await response.text();
    expect(body).toContain('"type":"chunk"');
    expect(body).toContain('Grounded response text.');
    expect(body).toContain('"text":"Grounded "');
    expect(body).toContain('"text":"response text."');
  });

  it('answers latest blog queries through the deterministic recency path instead of retrieval', async () => {
    getDirectAssistantAnswer.mockResolvedValue({
      citations: [
        {
          contentType: 'blog',
          id: 'direct:blog:latest',
          sectionTitle: 'Summary',
          snippet: 'Backpressure, Web Streams, and Node.js 24.x.',
          title:
            'Optimizing Node.js 24.x Streams: High-Performance Data Processing with Web Streams and Backpressure',
          url: '/blog/node-streams'
        }
      ],
      relatedContent: [],
      supported: true,
      textStream: (async function* () {
        yield 'The latest blog post is ';
        yield '"Optimizing Node.js 24.x Streams: High-Performance Data Processing with Web Streams and Backpressure".';
      })()
    });

    const { POST } = await import('@/app/api/ai/chat/route');

    const response = await POST(
      new NextRequest('http://localhost/api/ai/chat', {
        body: JSON.stringify({
          question: 'What is the latest blog?'
        }),
        method: 'POST'
      })
    );

    expect(response.status).toBe(200);
    expect(getDirectAssistantAnswer).toHaveBeenCalledTimes(1);
    expect(retrieveRelevantChunks).not.toHaveBeenCalled();
    expect(streamGroundedAnswer).not.toHaveBeenCalled();

    const body = await response.text();
    expect(body).toContain('The latest blog post is');
    expect(body).toContain('Optimizing Node.js 24.x Streams');
  });

  it('uses prior session messages as memory and exposes history for reload hydration', async () => {
    repositories.getChatSession.mockResolvedValueOnce({
      id: 'session-db-id',
      messages: [
        {
          citations: null,
          content: 'Tell me about Batibot.',
          groundedAnswer: null,
          id: 'user-1',
          relatedContent: null,
          role: 'USER'
        },
        {
          citations: [],
          content: 'Batibot is an AI-powered messaging companion.',
          groundedAnswer: {
            supported: true
          },
          id: 'assistant-1',
          relatedContent: [],
          role: 'ASSISTANT'
        }
      ],
      sessionKey: 'session-key'
    });

    const { GET, POST } = await import('@/app/api/ai/chat/route');

    const historyResponse = await GET(
      new NextRequest('http://localhost/api/ai/chat?sessionKey=session-key')
    );

    expect(historyResponse.status).toBe(200);
    expect(await historyResponse.json()).toEqual({
      messages: [
        {
          content: 'Tell me about Batibot.',
          id: 'user-1',
          role: 'user'
        },
        {
          citations: [],
          content: 'Batibot is an AI-powered messaging companion.',
          id: 'assistant-1',
          messageId: 'assistant-1',
          relatedContent: [],
          role: 'assistant',
          supported: true
        }
      ],
      sessionKey: 'session-key'
    });

    repositories.getChatSession.mockResolvedValueOnce({
      id: 'session-db-id',
      messages: [
        {
          citations: null,
          content: 'Tell me about Batibot.',
          groundedAnswer: null,
          id: 'user-1',
          relatedContent: null,
          role: 'USER'
        },
        {
          citations: [],
          content: 'Batibot is an AI-powered messaging companion.',
          groundedAnswer: {
            supported: true
          },
          id: 'assistant-1',
          relatedContent: [],
          role: 'ASSISTANT'
        }
      ],
      sessionKey: 'session-key'
    });

    const response = await POST(
      new NextRequest('http://localhost/api/ai/chat', {
        body: JSON.stringify({
          question: 'What stack did it use?'
        }),
        headers: {
          cookie: 'ai_chat_session=session-key'
        },
        method: 'POST'
      })
    );

    expect(response.status).toBe(200);
    const retrievalInput: unknown = retrieveRelevantChunks.mock.calls[0]?.[0];
    const groundedAnswerInput: unknown = streamGroundedAnswer.mock.calls[0]?.[0];

    expect(isRetrievalCallInput(retrievalInput)).toBe(true);
    expect(isGroundedAnswerCallInput(groundedAnswerInput)).toBe(true);

    if (!isRetrievalCallInput(retrievalInput) || !isGroundedAnswerCallInput(groundedAnswerInput)) {
      throw new Error('Expected retrieval and grounded answer calls to receive structured input.');
    }

    expect(retrievalInput.query).toContain('Tell me about Batibot.');
    expect(groundedAnswerInput.conversationHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: 'Tell me about Batibot.',
          role: 'user'
        })
      ])
    );
  });

  it('returns a rate-limited response when the limiter blocks chat requests', async () => {
    const { NextResponse } = await import('next/server');
    const { POST } = await import('@/app/api/ai/chat/route');

    rateLimitMiddleware.mockResolvedValueOnce(
      NextResponse.json({ code: 'RATE_LIMIT_EXCEEDED' }, { status: 429 })
    );

    const response = await POST(
      new NextRequest('http://localhost/api/ai/chat', {
        body: JSON.stringify({ question: 'Blocked' }),
        method: 'POST'
      })
    );

    expect(response.status).toBe(429);
  });

  it('returns related content for the current blog page', async () => {
    const { GET } = await import('@/app/api/ai/related/route');

    const response = await GET(
      new NextRequest('http://localhost/api/ai/related?blogSlug=grounded-assistant')
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      relatedContent: [
        {
          contentType: 'project',
          reason: 'Relevant project connection',
          title: 'Batibot',
          url: '/#projects'
        }
      ]
    });
  });

  it('validates transform requests and returns grounded transforms', async () => {
    const { POST } = await import('@/app/api/ai/transform/route');

    const invalidResponse = await POST(
      new NextRequest('http://localhost/api/ai/transform', {
        body: JSON.stringify({
          mode: 'invalid',
          postSlug: 'grounded-assistant'
        }),
        method: 'POST'
      })
    );

    expect(invalidResponse.status).toBe(400);

    const validResponse = await POST(
      new NextRequest('http://localhost/api/ai/transform', {
        body: JSON.stringify({
          mode: 'tldr',
          postSlug: 'grounded-assistant'
        }),
        method: 'POST'
      })
    );

    expect(validResponse.status).toBe(200);
    expect(generateBlogTransform).toHaveBeenCalledTimes(1);
  });

  it('persists feedback events', async () => {
    const { POST } = await import('@/app/api/ai/feedback/route');

    const response = await POST(
      new NextRequest('http://localhost/api/ai/feedback', {
        body: JSON.stringify({
          messageId: 'message-id',
          sessionKey: 'session-key',
          type: 'thumbs',
          value: 'up'
        }),
        method: 'POST'
      })
    );

    expect(response.status).toBe(200);
    expect(repositories.createAnswerFeedback).toHaveBeenCalledTimes(1);
  });

  it('rejects unauthorized reindex requests and accepts authorized ones', async () => {
    const { POST } = await import('@/app/api/ai/reindex/route');

    isAuthorizedAiReindexRequest.mockReturnValueOnce(false);

    const unauthorized = await POST(
      new NextRequest('http://localhost/api/ai/reindex', {
        body: JSON.stringify({}),
        method: 'POST'
      })
    );

    expect(unauthorized.status).toBe(401);

    const authorized = await POST(
      new NextRequest('http://localhost/api/ai/reindex', {
        body: JSON.stringify({ documentId: 'blog:grounded-assistant' }),
        headers: {
          authorization: 'Bearer secret'
        },
        method: 'POST'
      })
    );

    expect(authorized.status).toBe(200);
    expect(runSiteReindex).toHaveBeenCalledWith({ documentId: 'blog:grounded-assistant' });
  });
});
