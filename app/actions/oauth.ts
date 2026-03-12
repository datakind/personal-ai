'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  isOAuthConfigured,
  generateStateToken,
  buildAuthorizationUrl,
  deleteTokensForUser,
} from '@/lib/oauth';

/**
 * Initiates the OAuth linking flow.
 * 
 * This Server Action:
 * 1. Checks if OAuth is configured
 * 2. Requires user authentication
 * 3. Generates a CSRF state token
 * 4. Stores the state token in an httpOnly cookie with 10-minute expiration
 * 5. Builds the authorization URL
 * 6. Redirects the user to the external authorization endpoint
 * 
 * @returns An object with an error property if the flow cannot be initiated
 * @throws Redirect error when successful (Next.js redirect mechanism)
 */
export async function initiateLinking(): Promise<{ error?: string }> {
  // Check if OAuth is configured
  if (!isOAuthConfigured()) {
    return { error: 'OAuth is not configured' };
  }

  try {
    // Require authentication - throws error if not authenticated
    await requireAuth();

    // Generate cryptographically secure state token for CSRF protection
    const state = generateStateToken();

    // Store state in httpOnly cookie with 10-minute expiration
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes in seconds
      path: '/',
    });

    // Build authorization URL with state parameter
    const authUrl = buildAuthorizationUrl(state);

    // Redirect to external authorization endpoint
    // Note: redirect() throws a special error that Next.js handles
    redirect(authUrl);
  } catch (error) {
    // Re-throw redirect errors (Next.js uses these for navigation)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    console.error('Error initiating linking:', error);
    return { error: 'Failed to initiate linking' };
  }
}

/**
 * Unlinks the user's OAuth account by deleting stored tokens.
 * 
 * This Server Action:
 * 1. Requires user authentication
 * 2. Calls deleteTokensForUser() to remove all stored OAuth tokens
 * 3. Returns success or error response
 * 
 * Implements Requirements 6.1, 6.2, and 6.3:
 * - Deletes all stored tokens for the user (6.1)
 * - Removes the user's linked account status (6.2)
 * - Confirms the account is no longer linked (6.3)
 * 
 * @returns An empty object on success, or an object with an error property on failure
 */
export async function unlinkAccount(): Promise<{ error?: string }> {
  try {
    // Require authentication - throws error if not authenticated
    const user = await requireAuth();

    // Delete all OAuth tokens for the user
    await deleteTokensForUser(user.id);

    // Return success (empty object indicates success)
    return {};
  } catch (error) {
    console.error('Error unlinking account:', error);
    return { error: 'Failed to unlink account' };
  }
}
