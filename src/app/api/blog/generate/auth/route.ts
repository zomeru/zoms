import { NextResponse, type NextRequest } from 'next/server';

import {
  getBlogGenerationSessionCookie,
  getClearedBlogGenerationSessionCookie,
  hasBlogGenerationSecret,
  validateBlogGenerationSecret
} from '@/lib/blogGenerationAuth';
import { ApiError, handleApiError, validateSchema } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { blogGenerateAuthRequestSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!hasBlogGenerationSecret()) {
      throw new ApiError(getErrorMessage('UNAUTHORIZED'), 401, 'UNAUTHORIZED');
    }

    const body: unknown = await request.json();
    const { secret } = validateSchema(blogGenerateAuthRequestSchema, body);

    if (!validateBlogGenerationSecret(secret)) {
      throw new ApiError(getErrorMessage('UNAUTHORIZED'), 401, 'UNAUTHORIZED');
    }

    const response = NextResponse.json({ success: true, authorized: true });
    const cookie = getBlogGenerationSessionCookie();
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return handleApiError(error, {
      method: 'POST',
      path: '/api/blog/generate/auth'
    });
  }
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true, authorized: false });
  const cookie = getClearedBlogGenerationSessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
