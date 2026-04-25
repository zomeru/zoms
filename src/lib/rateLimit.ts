/**
 * Rate limiting utilities
 * Supports both Upstash Redis (production) and in-memory fallback (development)
 */

import { type NextRequest, NextResponse } from "next/server";

import log from "./logger";

// In-memory store for development
class InMemoryRateLimiter {
  private readonly requests = new Map<string, number[]>();
  // Sweep all expired identifiers once the map grows past this size.
  private static readonly CLEANUP_THRESHOLD = 100;

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  async limit(identifier: string): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(identifier) ?? [];
    const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

    if (recentRequests.length >= this.maxRequests) {
      return { success: false, remaining: 0 };
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    // Lazy sweep so we never accumulate unbounded memory.
    if (this.requests.size > InMemoryRateLimiter.CLEANUP_THRESHOLD) {
      this.cleanup();
    }

    return { success: true, remaining: this.maxRequests - recentRequests.length };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const windowStart = now - this.windowMs;
      if (timestamps.every((t) => t <= windowStart)) {
        this.requests.delete(key);
      }
    }
  }
}

// Configuration for different endpoints
export const RATE_LIMIT_CONFIGS = {
  AI_CHAT: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    message: "Too many AI chat requests. Please try again later."
  },
  AI_REINDEX: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    message: "Too many reindex requests. Please try again later."
  },
  AI_RELATED: {
    maxRequests: 60,
    windowMs: 60 * 1000,
    message: "Too many related-content lookups. Please try again later."
  },
  AI_TRANSFORM: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    message: "Too many transform requests. Please try again later."
  },
  // Stricter limit for blog generation endpoint
  BLOG_GENERATE: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many blog generation requests. Please try again later."
  },
  // Standard limit for blog API
  BLOG_API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests. Please try again later."
  },
  // General API limit
  DEFAULT: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests. Please try again later."
  }
} as const;

// Cached Upstash rate limiters for production (avoid recreating per request)
type UpstashRatelimit = Awaited<ReturnType<typeof createUpstashRateLimiter>>;
const upstashLimiters = new Map<string, UpstashRatelimit>();

async function createUpstashRateLimiter(
  config: (typeof RATE_LIMIT_CONFIGS)[keyof typeof RATE_LIMIT_CONFIGS]
) {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    throw new Error("Upstash Redis credentials are required to create a rate limiter.");
  }

  const redis = new Redis({
    url: redisUrl,
    token: redisToken
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs}ms`)
  });
}

async function getUpstashRateLimiter(
  configKey: keyof typeof RATE_LIMIT_CONFIGS,
  config: (typeof RATE_LIMIT_CONFIGS)[keyof typeof RATE_LIMIT_CONFIGS]
): Promise<UpstashRatelimit> {
  const key = `${configKey}_${config.maxRequests}_${config.windowMs}`;
  const existing = upstashLimiters.get(key);
  if (existing) return existing;

  const limiter = await createUpstashRateLimiter(config);
  upstashLimiters.set(key, limiter);
  return limiter;
}

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
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return "anonymous";
};

/**
 * Check rate limit for a request
 */
export const checkRateLimit = async (
  request: NextRequest,
  configKey: keyof typeof RATE_LIMIT_CONFIGS = "DEFAULT"
): Promise<{ success: boolean; remaining: number }> => {
  const identifier = getClientIdentifier(request);
  const config = RATE_LIMIT_CONFIGS[configKey];

  try {
    // Try to use Upstash if available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const ratelimit = await getUpstashRateLimiter(configKey, config);

        const result = await ratelimit.limit(identifier);

        return {
          success: result.success,
          remaining: result.remaining
        };
      } catch (error) {
        log.warn("Upstash rate limiting failed, falling back to in-memory", {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Fallback to in-memory rate limiter
    const limiter = getInMemoryLimiter(configKey);
    return await limiter.limit(identifier);
  } catch (error) {
    log.error("Rate limiting error", {
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
  configKey: keyof typeof RATE_LIMIT_CONFIGS = "DEFAULT"
): Promise<NextResponse | null> => {
  const result = await checkRateLimit(request, configKey);
  const config = RATE_LIMIT_CONFIGS[configKey];

  if (!result.success) {
    log.warn("Rate limit exceeded", {
      identifier: getClientIdentifier(request),
      path: request.nextUrl.pathname,
      config: configKey
    });

    return NextResponse.json(
      {
        error: config.message,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil(config.windowMs / 1000)
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(config.windowMs / 1000)),
          "X-RateLimit-Remaining": "0"
        }
      }
    );
  }

  log.debug("Rate limit check passed", {
    identifier: getClientIdentifier(request),
    remaining: result.remaining
  });

  return null;
};
