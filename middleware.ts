import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'auth_session';

function validateSessionToken(token: string): boolean {
  try {
    const SESSION_SECRET = process.env.API_TOKEN || 'default-secret';
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [secret] = decoded.split(':');
    return secret === SESSION_SECRET;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication for static files, Next.js internals, and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/robots.txt' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // /api/upload uses Bearer token authentication (handled in route)
  if (pathname === '/api/upload') {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value || !validateSessionToken(sessionCookie.value)) {
    // Redirect to login page for UI routes
    if (!pathname.startsWith('/api/')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Return 401 for API routes
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Authentication successful
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image).*)',
  ],
};
