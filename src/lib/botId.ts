import { NextResponse, type NextRequest } from 'next/server';
import { checkBotId } from 'botid/server';

export interface BotIdProtectedRoute {
  method: string;
  path: string;
}

export const BOTID_PROTECTED_ROUTES: BotIdProtectedRoute[] = [
  { path: '/api/*', method: 'GET' },
  { path: '/api/*', method: 'POST' },
  { path: '/api/*', method: 'PUT' },
  { path: '/api/*', method: 'PATCH' },
  { path: '/api/*', method: 'DELETE' }
];

interface VerifyBotIdRequestOptions {
  allowAuthorizedServiceRequest?: boolean;
}

export async function verifyBotIdRequest(
  request: NextRequest,
  options: VerifyBotIdRequestOptions = {}
): Promise<NextResponse | null> {
  if (options.allowAuthorizedServiceRequest && request.headers.has('authorization')) {
    return null;
  }

  const verification = await checkBotId();

  if (!verification.isBot || verification.isVerifiedBot) {
    return null;
  }

  return NextResponse.json({ error: 'Bot detected. Access denied.' }, { status: 403 });
}
