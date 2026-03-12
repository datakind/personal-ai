import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import {
  exchangeCodeForTokens,
  storeTokens,
  isOAuthConfigured,
} from '@/lib/oauth';

/**
 * OAuth callback route handler.
 * 
 * This route receives the OAuth callback from the external system after
 * the user authorizes. It validates the state token, exchanges the
 * authorization code for tokens, and redirects back to the settings page.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 8.1, 8.2, 8.3, 8.4
 * 
 * Query Parameters:
 * - code: Authorization code from the external system
 * - state: CSRF protection token that must match stored session value
 * - error: Optional error code if authorization was denied
 * 
 * @param request - Next.js request object with query parameters
 * @returns Redirect response to settings page with success/error message
 */
export async function GET(request: NextRequest) {
  // Requirement 3.1: Validate OAuth configuration is available
  if (!isOAuthConfigured()) {
    return NextResponse.redirect(
      new URL('/settings?error=oauth_not_configured', request.url)
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Requirement 8.1: Handle authorization denial errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=authorization_denied&details=${error}`, request.url)
    );
  }

  // Requirement 3.2: Extract code and state parameters from query string
  // Validate required parameters are present
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?error=invalid_callback', request.url)
    );
  }

  try {
    // Requirement 3.6: Get current authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=authentication_required', request.url)
      );
    }

    // Requirement 3.3: Validate state parameter matches stored session value
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    // Requirement 8.4: State validation failure displays security error
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', request.url)
      );
    }

    // Clear state cookie after validation (one-time use)
    cookieStore.delete('oauth_state');

    // Requirement 3.7: Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);

    // Requirement 4.1: Store tokens in database
    await storeTokens(
      user.id,
      tokenResponse.access_token,
      tokenResponse.refresh_token || null,
      tokenResponse.expires_in
    );
    
    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/settings?success=account_linked', request.url)
    );
  } catch (error) {
    // Requirement 8.2: Network errors display connection problem message
    // Requirement 8.3: Invalid credentials display configuration error message
    console.error('OAuth callback error:', error);
    
    // Determine error type from error message
    let errorParam = 'token_exchange_failed';
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorParam = 'connection_error';
      } else if (error.message.includes('credentials') || error.message.includes('401')) {
        errorParam = 'configuration_error';
      }
    }
    
    return NextResponse.redirect(
      new URL(`/settings?error=${errorParam}`, request.url)
    );
  }
}
