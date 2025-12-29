import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'auth_session';
const SESSION_SECRET = process.env.API_TOKEN || 'default-secret';

// Simple session token - in production use proper JWT
export function createSessionToken(): string {
  const timestamp = Date.now();
  const data = `${SESSION_SECRET}:${timestamp}`;
  return Buffer.from(data).toString('base64');
}

export function validateSessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [secret] = decoded.split(':');
    return secret === SESSION_SECRET;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return false;
  }

  return validateSessionToken(sessionCookie.value);
}

export function getSessionFromRequest(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return false;
  }

  return validateSessionToken(sessionCookie.value);
}

export async function setSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = createSessionToken();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function verifyCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    console.error('BASIC_AUTH_USER or BASIC_AUTH_PASS not configured');
    return false;
  }

  return username === expectedUser && password === expectedPass;
}
