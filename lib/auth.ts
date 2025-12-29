import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify Basic Auth credentials
 */
export function verifyBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    console.error('BASIC_AUTH_USER or BASIC_AUTH_PASS not configured');
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(username, expectedUser) && timingSafeEqual(password, expectedPass);
}

/**
 * Verify Bearer token for API access
 */
export function verifyBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const expectedToken = process.env.API_TOKEN;

  if (!expectedToken) {
    console.error('API_TOKEN not configured');
    return false;
  }

  return timingSafeEqual(token, expectedToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to prevent length-based timing attacks
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create a 401 Unauthorized response for Basic Auth
 */
export function unauthorizedResponse(): NextResponse {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Private Area"',
    },
  });
}

/**
 * Create a 401 Unauthorized response for Bearer token
 */
export function unauthorizedBearerResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Invalid or missing API token' },
    { status: 401 }
  );
}

/**
 * Extract project name from X-Project-Name header
 */
export function getProjectFromHeader(request: NextRequest): string | null {
  return request.headers.get('x-project-name');
}
