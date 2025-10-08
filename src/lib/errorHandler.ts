/**
 * Centralized error handling utilities
 * Provides environment-aware error messages and consistent error responses
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import log from './logger';
import type { ErrorResponse } from './schemas';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Sanitize error message for production
 * Removes sensitive information and provides user-friendly messages
 */
const sanitizeErrorMessage = (error: unknown): string => {
  if (IS_DEVELOPMENT) {
    // In development, provide detailed error messages
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // In production, provide safe, user-friendly messages
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    return 'Invalid request data';
  }

  // Generic error for production
  return 'An error occurred while processing your request';
};

/**
 * Get appropriate HTTP status code for an error
 */
const getErrorStatusCode = (error: unknown): number => {
  if (error instanceof ApiError) {
    return error.statusCode;
  }

  if (error instanceof ZodError) {
    return 400; // Bad Request
  }

  return 500; // Internal Server Error
};

/**
 * Get error code for logging and debugging
 */
const getErrorCode = (error: unknown): string => {
  if (error instanceof ApiError && error.code) {
    return error.code;
  }

  if (error instanceof ZodError) {
    return 'VALIDATION_ERROR';
  }

  if (error instanceof Error) {
    return error.name.toUpperCase().replace(/ERROR$/, '_ERROR');
  }

  return 'UNKNOWN_ERROR';
};

/**
 * Get error details for logging (dev only)
 */
const getErrorDetails = (error: unknown): unknown => {
  if (!IS_DEVELOPMENT) {
    return undefined;
  }

  if (error instanceof ZodError) {
    return error.issues;
  }

  if (error instanceof Error && error.stack) {
    return { stack: error.stack };
  }

  return undefined;
};

/**
 * Handle API errors consistently
 * Logs the error and returns appropriate response
 */
export const handleApiError = (
  error: unknown,
  context?: {
    method?: string;
    path?: string;
    metadata?: Record<string, unknown>;
  }
): NextResponse<ErrorResponse> => {
  const statusCode = getErrorStatusCode(error);
  const code = getErrorCode(error);
  const message = sanitizeErrorMessage(error);
  const details = getErrorDetails(error);

  // Log error with context
  log.error('API Error', {
    code,
    message: error instanceof Error ? error.message : String(error),
    statusCode,
    method: context?.method,
    path: context?.path,
    details,
    ...context?.metadata
  });

  // Return error response
  const errorResponse: ErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...(IS_DEVELOPMENT && details ? { details } : {})
  };

  return NextResponse.json(errorResponse, { status: statusCode });
};

/**
 * Validate Zod schema and throw ApiError on validation failure
 */
export const validateSchema = <T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
  errorMessage = 'Invalid request data'
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(errorMessage, 400, 'VALIDATION_ERROR', error.issues);
    }
    throw error;
  }
};

/**
 * Safe parse that returns result or undefined
 */
export const safeValidate = <T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: ZodError } },
  data: unknown
): T | undefined => {
  const result = schema.safeParse(data);
  if (result.success && result.data !== undefined) {
    return result.data;
  }
  return undefined;
};

/**
 * Wrap async API handler with error handling
 */
export const withErrorHandling = async <T>(
  handler: () => Promise<T>,
  context?: {
    method?: string;
    path?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<T | NextResponse<ErrorResponse>> => {
  try {
    return await handler();
  } catch (error: unknown) {
    return handleApiError(error, context);
  }
};
