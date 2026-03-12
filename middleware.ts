import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public paths that don't require authentication
 * Requirements: 4.1, 4.4
 */
const publicPaths = [
  '/',
  '/login',
  '/email-prompt',
  '/api/health',
];

/**
 * Middleware for route protection
 * 
 * Validates:
 * - Requirements 4.1: Unauthenticated requests redirect to login
 * - Requirements 4.4: Missing/invalid tokens treated as unauthenticated
 * - Requirements 4.5: Login redirect preserves return URL
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths (Requirements 4.1, 4.4)
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files (Requirements 4.1, 4.4)
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Check for session cookie (Requirements 4.1, 4.4)
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    // Redirect to login with return URL and session expired flag (Requirements 4.1, 4.5, 9.2)
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    loginUrl.searchParams.set('sessionExpired', 'true');
    return NextResponse.redirect(loginUrl);
  }

  // Session validation happens in Server Components via getSession()
  // Allow request to proceed (Requirements 4.2)
  return NextResponse.next();
}

/**
 * Matcher configuration for middleware
 * Applies to all routes except static files and Next.js internals
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
