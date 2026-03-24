import { NextResponse, type NextRequest } from 'next/server';

import {
  getAiReindexSessionCookie,
  getClearedAiReindexSessionCookie,
  hasAiReindexSecret,
  validateAiReindexSecret
} from '@/lib/ai/reindexAuth';
import { verifyBotIdRequest } from '@/lib/botId';
import { ApiError, handleApiError, validateSchema } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { blogGenerateAuthRequestSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const botIdResponse = await verifyBotIdRequest(request);
    if (botIdResponse) {
      return botIdResponse;
    }

    if (!hasAiReindexSecret()) {
      throw new ApiError(getErrorMessage('UNAUTHORIZED'), 401, 'UNAUTHORIZED');
    }

    const body: unknown = await request.json();
    const { secret } = validateSchema(blogGenerateAuthRequestSchema, body);

    if (!validateAiReindexSecret(secret)) {
      throw new ApiError(getErrorMessage('UNAUTHORIZED'), 401, 'UNAUTHORIZED');
    }

    const response = NextResponse.json({ success: true, authorized: true });
    const cookie = getAiReindexSessionCookie();
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return handleApiError(error, {
      method: 'POST',
      path: '/api/ai/reindex/auth'
    });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const botIdResponse = await verifyBotIdRequest(request);
  if (botIdResponse) {
    return botIdResponse;
  }

  const response = NextResponse.json({ success: true, authorized: false });
  const cookie = getClearedAiReindexSessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
