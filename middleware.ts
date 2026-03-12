import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';

// Use Node.js runtime instead of Edge runtime for SQLite support
export const runtime = 'nodejs';

/**
 * Next.js middleware for session validation and route protection.
 * 
 * This middleware runs on every request (except static assets) to:
 * - Validate user sessions using HTTP-only cookies
 * - Protect routes by redirecting unauthenticated users to /login
 * - Redirect authenticated users away from /login to the home page
 * 
 * @param request - The incoming Next.js request object
 * @returns A NextResponse that either allows the request or redirects
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  
  // Extract session token from cookies
  const sessionToken = request.cookies.get('session')?.value;
  
  // Validate session
  let isAuthenticated = false;
  if (sessionToken) {
    const result = await validateSession(sessionToken);
    isAuthenticated = result !== null;
  }
  
  // Login route handling
  if (pathname === '/login') {
    // Redirect authenticated users away from login page to home
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Allow unauthenticated users to access login page
    return NextResponse.next();
  }
  
  // Protected routes handling (all routes except /login)
  if (!isAuthenticated) {
    // Redirect unauthenticated users to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Allow authenticated users to access protected routes
  return NextResponse.next();
}

/**
 * Middleware configuration.
 * 
 * The matcher ensures middleware runs on all routes except:
 * - /api/* - API routes
 * - /_next/static/* - Static files
 * - /_next/image/* - Image optimization files
 * - /favicon.ico - Favicon
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
