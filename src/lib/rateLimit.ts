/**
 * Rate limiting utilities
 * Supports both Upstash Redis (production) and in-memory fallback (development)
 */

import { NextResponse, type NextRequest } from 'next/server';

import log from './logger';

// In-memory store for development
class InMemoryRateLimiter {
  private readonly requests = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  async limit(identifier: string): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) ?? [];

    // Filter out requests outside the current window
    const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return {
        success: false,
        remaining: 0
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to cleanup
      this.cleanup();
    }

    return {
      success: true,
      remaining: this.maxRequests - recentRequests.length
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const windowStart = now - this.windowMs;
      const recentRequests = timestamps.filter((timestamp) => timestamp > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Configuration for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Stricter limit for blog generation endpoint
  BLOG_GENERATE: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many blog generation requests. Please try again later.'
  },
  // Standard limit for blog API
  BLOG_API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please try again later.'
  },
  // General API limit
  DEFAULT: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please try again later.'
  }
} as const;

// In-memory rate limiters for development
const inMemoryLimiters = new Map<string, InMemoryRateLimiter>();

/**
 * Get or create an in-memory rate limiter
 */
const getInMemoryLimiter = (configKey: keyof typeof RATE_LIMIT_CONFIGS): InMemoryRateLimiter => {
  const config = RATE_LIMIT_CONFIGS[configKey];
  const key = `${configKey}_${config.maxRequests}_${config.windowMs}`;

  const existingLimiter = inMemoryLimiters.get(key);
  if (existingLimiter) {
    return existingLimiter;
  }

  const newLimiter = new InMemoryRateLimiter(config.maxRequests, config.windowMs);
  inMemoryLimiters.set(key, newLimiter);
  return newLimiter;
};

/**
 * Get client identifier from request
 */
const getClientIdentifier = (request: NextRequest): string => {
  // Try to get IP from headers (Vercel provides these)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'anonymous';
};

/**
 * Check rate limit for a request
 */
export const checkRateLimit = async (
  request: NextRequest,
  configKey: keyof typeof RATE_LIMIT_CONFIGS = 'DEFAULT'
): Promise<{ success: boolean; remaining: number }> => {
  const identifier = getClientIdentifier(request);
  const config = RATE_LIMIT_CONFIGS[configKey];

  try {
    // Try to use Upstash if available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Ratelimit } = await import('@upstash/ratelimit');
        const { Redis } = await import('@upstash/redis');

        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN
        });

        const ratelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs}ms`)
        });

        const result = await ratelimit.limit(identifier);

        return {
          success: result.success,
          remaining: result.remaining
        };
      } catch (error) {
        log.warn('Upstash rate limiting failed, falling back to in-memory', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Fallback to in-memory rate limiter
    const limiter = getInMemoryLimiter(configKey);
    return await limiter.limit(identifier);
  } catch (error) {
    log.error('Rate limiting error', {
      error: error instanceof Error ? error.message : String(error),
      ...(error instanceof Error && error.stack ? { stack: error.stack } : {})
    });

    // On error, allow the request but log it
    return { success: true, remaining: 0 };
  }
};

/**
 * Middleware-style rate limiting
 * Returns null if rate limit passed, otherwise returns NextResponse with error
 */
export const rateLimitMiddleware = async (
  request: NextRequest,
  configKey: keyof typeof RATE_LIMIT_CONFIGS = 'DEFAULT'
): Promise<NextResponse | null> => {
  const result = await checkRateLimit(request, configKey);
  const config = RATE_LIMIT_CONFIGS[configKey];

  if (!result.success) {
    log.warn('Rate limit exceeded', {
      identifier: getClientIdentifier(request),
      path: request.nextUrl.pathname,
      config: configKey
    });

    return NextResponse.json(
      {
        error: config.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(config.windowMs / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(config.windowMs / 1000)),
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  }

  log.debug('Rate limit check passed', {
    identifier: getClientIdentifier(request),
    remaining: result.remaining
  });

  return null;
};
