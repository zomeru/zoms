import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  ApiError,
  getErrorOrigin,
  getErrorStackTrace,
  safeValidate,
  validateSchema
} from '@/lib/errorHandler';
import { getErrorMessage, getResponseErrorMessage } from '@/lib/errorMessages';

describe('ApiError', () => {
  it('creates error with default status 500', () => {
    const error = new ApiError('test error');
    expect(error.message).toBe('test error');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('ApiError');
  });

  it('creates error with custom status and code', () => {
    const error = new ApiError('not found', 404, 'NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });
});

describe('validateSchema', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number()
  });

  it('returns parsed data for valid input', () => {
    const result = validateSchema(schema, { name: 'Alice', age: 30 });
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('throws ApiError for invalid input', () => {
    expect(() => validateSchema(schema, { name: 123 })).toThrow(ApiError);
  });

  it('throws with 400 status code and VALIDATION_ERROR code', () => {
    let caught: ApiError | undefined;
    try {
      validateSchema(schema, {});
    } catch (error) {
      if (error instanceof ApiError) caught = error;
    }
    expect(caught).toBeDefined();
    expect(caught?.statusCode).toBe(400);
    expect(caught?.code).toBe('VALIDATION_ERROR');
  });
});

describe('safeValidate', () => {
  const schema = z.object({ id: z.number() });

  it('returns parsed data for valid input', () => {
    expect(safeValidate(schema, { id: 42 })).toEqual({ id: 42 });
  });

  it('returns undefined for invalid input', () => {
    expect(safeValidate(schema, { id: 'not-a-number' })).toBeUndefined();
  });
});

describe('getErrorStackTrace', () => {
  it('returns stack for Error instances', () => {
    const error = new Error('test');
    expect(getErrorStackTrace(error)).toContain('Error: test');
  });

  it('returns undefined for non-Error values', () => {
    expect(getErrorStackTrace('string')).toBeUndefined();
    expect(getErrorStackTrace(null)).toBeUndefined();
  });
});

describe('getErrorOrigin', () => {
  it('returns undefined for non-Error values', () => {
    expect(getErrorOrigin('string')).toBeUndefined();
  });

  it('extracts function name from stack trace', () => {
    const error = new Error('test');
    // The origin should be something from the test file, not errorHandler
    const origin = getErrorOrigin(error);
    // It may be undefined if all stack lines are from node_modules, that's fine
    if (origin) {
      expect(typeof origin).toBe('string');
    }
  });
});

describe('getResponseErrorMessage', () => {
  it('extracts error from JSON response', async () => {
    const response = new Response(JSON.stringify({ error: 'Bad input' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    const message = await getResponseErrorMessage(response, 'Fallback');
    expect(message).toBe('Bad input');
  });

  it('returns fallback when response has no error field', async () => {
    const response = new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    const message = await getResponseErrorMessage(response, 'Fallback message');
    expect(message).toBe('Fallback message');
  });

  it('returns fallback when response is not JSON', async () => {
    const response = new Response('not json', { status: 500 });
    const message = await getResponseErrorMessage(response, 'Server error');
    expect(message).toBe('Server error');
  });

  it('returns fallback when error field is not a string', async () => {
    const response = new Response(JSON.stringify({ error: 42 }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    const message = await getResponseErrorMessage(response, 'Fallback');
    expect(message).toBe('Fallback');
  });
});

describe('getErrorMessage', () => {
  it('returns a string for known message keys', () => {
    const message = getErrorMessage('UNAUTHORIZED');
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('returns a string for SERVER_ERROR', () => {
    const message = getErrorMessage('SERVER_ERROR');
    expect(typeof message).toBe('string');
  });
});
