/**
 * Centralized error messages
 * Provides environment-aware error messages for consistent error handling
 */

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Error message definitions with development and production variants
 */
export const ERROR_MESSAGES = {
  // Authentication & Authorization
  UNAUTHORIZED: {
    dev: 'Unauthorized: Invalid or missing authorization token. Please provide a valid Bearer token.',
    prod: 'Access denied. Please check your credentials and try again.'
  },
  INVALID_SECRET: {
    dev: 'Invalid secret token provided. Expected format: Bearer <token>',
    prod: 'Invalid authentication token. Please try again.'
  },

  // Configuration
  MISSING_SANITY_CONFIG: {
    dev: 'Sanity configuration is incomplete. Required: SANITY_API_TOKEN, NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET',
    prod: 'Service configuration error. Please contact support.'
  },
  MISSING_GEMINI_KEY: {
    dev: 'GEMINI_API_KEY environment variable is not set. Cannot generate AI content.',
    prod: 'AI service is not configured. Please contact support.'
  },

  // Data & Validation
  INVALID_REQUEST_DATA: {
    dev: 'Request data validation failed. Check the request payload format.',
    prod: 'Invalid request data. Please check your input and try again.'
  },
  BLOG_POST_NOT_FOUND: {
    dev: 'Blog post with the specified slug does not exist in the database.',
    prod: 'The requested blog post could not be found.'
  },
  MISSING_REQUIRED_FIELDS: {
    dev: 'AI response is missing required fields (title, body, or summary).',
    prod: 'Failed to generate complete content. Please try again.'
  },

  // AI Generation
  AI_GENERATION_FAILED: {
    dev: 'Failed to parse AI-generated content. The response format may be invalid.',
    prod: 'Content generation failed. Please try again.'
  },
  AI_JSON_PARSE_ERROR: {
    dev: 'Could not extract or parse JSON from AI response. Response may be malformed.',
    prod: 'Failed to process generated content. Please try again.'
  },
  AI_BODY_EXTRACTION_ERROR: {
    dev: 'Could not find the end of body string in AI response.',
    prod: 'Content generation incomplete. Please try again.'
  },

  // Network & Server
  FETCH_FAILED: {
    dev: 'Network request failed. Check your connection and server status.',
    prod: 'Failed to load data. Please check your connection and try again.'
  },
  SERVER_ERROR: {
    dev: 'Internal server error occurred. Check server logs for details.',
    prod: 'An error occurred while processing your request. Please try again later.'
  },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: {
    dev: 'Rate limit exceeded. Too many requests from this IP address.',
    prod: 'Too many requests. Please wait a moment and try again.'
  },

  // Generic
  UNKNOWN_ERROR: {
    dev: 'An unexpected error occurred. Check the error details for more information.',
    prod: 'Something went wrong. Please try again later.'
  }
} as const;

/**
 * Get environment-appropriate error message
 */
export const getErrorMessage = (messageKey: keyof typeof ERROR_MESSAGES): string => {
  const messages = ERROR_MESSAGES[messageKey];
  return IS_DEVELOPMENT ? messages.dev : messages.prod;
};

/**
 * Client-side error messages (always user-friendly, never technical)
 */
export const CLIENT_ERROR_MESSAGES = {
  LOAD_MORE_FAILED: 'Unable to load more posts. Please try again.',
  GENERATE_BLOG_FAILED: 'Failed to generate blog post. Please try again.',
  TOKEN_REQUIRED: 'Please enter the blog generation secret token.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNKNOWN: 'Something went wrong. Please try again.'
} as const;

/**
 * Get user-friendly error message for client-side display
 */
export const getClientErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Check if error message matches known error patterns
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return CLIENT_ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.message.includes('generate')) {
      return CLIENT_ERROR_MESSAGES.GENERATE_BLOG_FAILED;
    }
    if (error.message.includes('load')) {
      return CLIENT_ERROR_MESSAGES.LOAD_MORE_FAILED;
    }
    // For known API errors, pass through the message (already sanitized by backend)
    return error.message;
  }
  return CLIENT_ERROR_MESSAGES.UNKNOWN;
};
