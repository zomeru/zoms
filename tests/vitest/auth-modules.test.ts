import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('blogGenerationAuth', () => {
  const TEST_SECRET = 'test-blog-secret-123';

  beforeEach(() => {
    vi.stubEnv('BLOG_GENERATION_SECRET', TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadModule() {
    return await import('@/lib/blogGenerationAuth');
  }

  describe('hasBlogGenerationSecret', () => {
    it('returns true when BLOG_GENERATION_SECRET is set', async () => {
      const { hasBlogGenerationSecret } = await loadModule();
      expect(hasBlogGenerationSecret()).toBe(true);
    });

    it('returns true when only CRON_SECRET is set', async () => {
      vi.stubEnv('BLOG_GENERATION_SECRET', '');
      delete process.env.BLOG_GENERATION_SECRET;
      vi.stubEnv('CRON_SECRET', 'cron-fallback');
      const { hasBlogGenerationSecret } = await loadModule();
      expect(hasBlogGenerationSecret()).toBe(true);
    });

    it('returns false when no secret is configured', async () => {
      delete process.env.BLOG_GENERATION_SECRET;
      delete process.env.CRON_SECRET;
      const { hasBlogGenerationSecret } = await loadModule();
      expect(hasBlogGenerationSecret()).toBe(false);
    });
  });

  describe('validateBlogGenerationSecret', () => {
    it('returns true for correct secret', async () => {
      const { validateBlogGenerationSecret } = await loadModule();
      expect(validateBlogGenerationSecret(TEST_SECRET)).toBe(true);
    });

    it('returns false for wrong secret', async () => {
      const { validateBlogGenerationSecret } = await loadModule();
      expect(validateBlogGenerationSecret('wrong-secret')).toBe(false);
    });

    it('returns false for secret with different length', async () => {
      const { validateBlogGenerationSecret } = await loadModule();
      expect(validateBlogGenerationSecret('short')).toBe(false);
    });

    it('returns false when no secret is configured', async () => {
      delete process.env.BLOG_GENERATION_SECRET;
      delete process.env.CRON_SECRET;
      const { validateBlogGenerationSecret } = await loadModule();
      expect(validateBlogGenerationSecret(TEST_SECRET)).toBe(false);
    });
  });

  describe('isValidBlogGenerationSession', () => {
    it('validates correct HMAC cookie', async () => {
      const { isValidBlogGenerationSession, getBlogGenerationSessionCookie } = await loadModule();
      const cookie = getBlogGenerationSessionCookie();
      const mockCookieStore = {
        get: (name: string) =>
          name === cookie.name ? { name: cookie.name, value: cookie.value } : undefined
      };
      expect(isValidBlogGenerationSession(mockCookieStore)).toBe(true);
    });

    it('rejects invalid cookie value', async () => {
      const { isValidBlogGenerationSession } = await loadModule();
      const mockCookieStore = {
        get: (name: string) =>
          name === 'blog_generation_session'
            ? { name: 'blog_generation_session', value: 'invalid-value' }
            : undefined
      };
      expect(isValidBlogGenerationSession(mockCookieStore)).toBe(false);
    });

    it('returns false when no cookie exists', async () => {
      const { isValidBlogGenerationSession } = await loadModule();
      const mockCookieStore = {
        get: () => undefined
      };
      expect(isValidBlogGenerationSession(mockCookieStore)).toBe(false);
    });
  });

  describe('getBlogGenerationSessionCookie', () => {
    it('returns deterministic HMAC cookie value', async () => {
      const { getBlogGenerationSessionCookie } = await loadModule();
      const cookie1 = getBlogGenerationSessionCookie();
      const cookie2 = getBlogGenerationSessionCookie();
      expect(cookie1.value).toBe(cookie2.value);
    });

    it('produces valid HMAC-SHA256 hex string', async () => {
      const { getBlogGenerationSessionCookie } = await loadModule();
      const cookie = getBlogGenerationSessionCookie();
      expect(cookie.value).toMatch(/^[a-f0-9]{64}$/);
    });

    it('sets httpOnly and sameSite attributes', async () => {
      const { getBlogGenerationSessionCookie } = await loadModule();
      const cookie = getBlogGenerationSessionCookie();
      expect(cookie.options.httpOnly).toBe(true);
      expect(cookie.options.sameSite).toBe('lax');
    });

    it('throws when no secret configured', async () => {
      delete process.env.BLOG_GENERATION_SECRET;
      delete process.env.CRON_SECRET;
      const { getBlogGenerationSessionCookie } = await loadModule();
      expect(() => getBlogGenerationSessionCookie()).toThrow(
        'BLOG_GENERATION_SECRET is not configured'
      );
    });
  });
});

describe('reindexAuth', () => {
  const TEST_SECRET = 'test-reindex-secret-456';

  beforeEach(() => {
    vi.stubEnv('AI_REINDEX_SECRET', TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadModule() {
    return await import('@/lib/ai/reindexAuth');
  }

  describe('validateAiReindexSecret', () => {
    it('returns true for correct secret', async () => {
      const { validateAiReindexSecret } = await loadModule();
      expect(validateAiReindexSecret(TEST_SECRET)).toBe(true);
    });

    it('returns false for incorrect secret', async () => {
      const { validateAiReindexSecret } = await loadModule();
      expect(validateAiReindexSecret('wrong')).toBe(false);
    });

    it('returns false when no secret is configured', async () => {
      delete process.env.AI_REINDEX_SECRET;
      const { validateAiReindexSecret } = await loadModule();
      expect(validateAiReindexSecret(TEST_SECRET)).toBe(false);
    });
  });

  describe('isValidAiReindexSession', () => {
    it('validates correct HMAC cookie', async () => {
      const { isValidAiReindexSession, getAiReindexSessionCookie } = await loadModule();
      const cookie = getAiReindexSessionCookie();
      const mockCookieStore = {
        get: (name: string) =>
          name === cookie.name ? { name: cookie.name, value: cookie.value } : undefined
      };
      expect(isValidAiReindexSession(mockCookieStore)).toBe(true);
    });

    it('rejects tampered cookie', async () => {
      const { isValidAiReindexSession } = await loadModule();
      const mockCookieStore = {
        get: (name: string) =>
          name === 'ai_reindex_session'
            ? { name: 'ai_reindex_session', value: 'tampered-value' }
            : undefined
      };
      expect(isValidAiReindexSession(mockCookieStore)).toBe(false);
    });
  });

  describe('getAiReindexSessionCookie', () => {
    it('produces deterministic value', async () => {
      const { getAiReindexSessionCookie } = await loadModule();
      const a = getAiReindexSessionCookie();
      const b = getAiReindexSessionCookie();
      expect(a.value).toBe(b.value);
      expect(a.value).toMatch(/^[a-f0-9]{64}$/);
    });

    it('throws when no secret configured', async () => {
      delete process.env.AI_REINDEX_SECRET;
      const { getAiReindexSessionCookie } = await loadModule();
      expect(() => getAiReindexSessionCookie()).toThrow('AI_REINDEX_SECRET is not configured');
    });
  });
});
