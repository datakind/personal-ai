import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { sessions, users, type User, type Session } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';

/**
 * Generates a cryptographically secure session token.
 * Uses 32 random bytes (256 bits of entropy) encoded as base64url.
 * 
 * @returns A base64url-encoded session token string
 */
export function generateSessionToken(): string {
  const token = randomBytes(32);
  return token.toString('base64url');
}

/**
 * Creates a new session for the specified user.
 * Generates a cryptographically secure session token and stores the session
 * in the database with an 8-hour expiration time.
 * 
 * @param userId - The ID of the user to create a session for
 * @returns The generated session token string
 * @throws Error if session creation fails
 */
export async function createSession(userId: number): Promise<string> {
  try {
    const token = generateSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours from now

    await db.insert(sessions).values({
      id: token,
      userId,
      expiresAt,
      createdAt: now,
    });

    return token;
  } catch (error) {
    console.error('Create session error:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Validates a session token and returns the associated user and session data.
 * Checks if the session exists and is not expired. If the session is expired,
 * it is automatically deleted from the database.
 * 
 * @param token - The session token to validate
 * @returns An object containing the user and session data if valid, or null if invalid/expired
 */
export async function validateSession(
  token: string
): Promise<{ user: User; session: Session } | null> {
  try {
    // Query session by token with user relation
    const result = await db.query.sessions.findFirst({
      where: eq(sessions.id, token),
      with: {
        user: true,
      },
    });

    // Check if session exists
    if (!result) {
      return null;
    }

    // Check if session is expired
    const now = new Date();
    if (result.expiresAt < now) {
      // Delete expired session
      try {
        await db.delete(sessions).where(eq(sessions.id, token));
      } catch (deleteError) {
        // Log but don't fail validation if delete fails
        console.error('Failed to delete expired session:', deleteError);
      }
      return null;
    }

    // Return valid user and session data
    return {
      user: result.user,
      session: {
        id: result.id,
        userId: result.userId,
        expiresAt: result.expiresAt,
        createdAt: result.createdAt,
      },
    };
  } catch (error) {
    console.error('Validate session error:', error);
    return null;
  }
}

/**
 * Invalidates a session by deleting it from the database.
 * Used during logout to terminate a user's session.
 * 
 * @param token - The session token to invalidate
 */
export async function invalidateSession(token: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.id, token));
  } catch (error) {
    console.error('Invalidate session error:', error);
    // Don't throw - logout should succeed even if session deletion fails
  }
}

/**
 * Retrieves the current authenticated user from the session cookie.
 * This function is designed to be called from Server Components and Server Actions.
 * 
 * @returns The authenticated user object if a valid session exists, or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  const result = await validateSession(sessionToken);
  
  if (!result) {
    return null;
  }

  return result.user;
}

/**
 * Retrieves the current authenticated user or throws an error if not authenticated.
 * This function is designed to be called from Server Components and Server Actions
 * that require authentication.
 * 
 * @returns The authenticated user object
 * @throws Error if no valid session exists
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Removes all expired sessions from the database.
 * This function deletes sessions where the expiration timestamp is less than the current time.
 * Should be called periodically to clean up stale session data.
 * 
 * @returns A promise that resolves when cleanup is complete
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const now = new Date();
    await db.delete(sessions).where(lt(sessions.expiresAt, now));
  } catch (error) {
    console.error('Cleanup expired sessions error:', error);
    // Don't throw - cleanup failures should not break the application
  }
}

/**
 * Represents the qualification status of a user for PHQ-9 assessments.
 */
export type UserQualificationStatus = {
  hasLinkedAccount: boolean;
  phq9Qualified: boolean;
};

/**
 * External API response format for user qualifications.
 */
type ExternalQualificationResponse = {
  qualifications: {
    phq9: boolean;
  };
};

/**
 * Retrieves the PHQ-9 qualification status for a user.
 * Checks if the user has linked their account via OAuth and queries the external API.
 * Automatically refreshes expired tokens before making API calls.
 * 
 * @param userId - The ID of the user to check qualification for
 * @returns An object indicating if the user has a linked account and their PHQ-9 qualification status
 */
export async function getUserQualificationStatus(userId: number): Promise<UserQualificationStatus> {
  try {
    // Import OAuth functions dynamically to avoid circular dependencies
    const { getTokensForUser, getValidAccessToken } = await import('@/lib/oauth');
    
    // Check if user has a linked account
    const tokenRecord = await getTokensForUser(userId);

    // If no linked account, return not qualified
    if (!tokenRecord) {
      return {
        hasLinkedAccount: false,
        phq9Qualified: false,
      };
    }

    // Get a valid access token (automatically refreshes if expired)
    const accessToken = await getValidAccessToken(userId);

    // If token refresh failed or no valid token available, return not qualified
    if (!accessToken) {
      return {
        hasLinkedAccount: false, // Account is no longer linked after failed refresh
        phq9Qualified: false,
      };
    }

    // Call external API with valid OAuth token
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

      const response = await fetch(process.env.EXTERNAL_API_URL + '/api/user/qualifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // API returned error - default to not qualified
        console.error('External API error:', response.status, response.statusText);
        return {
          hasLinkedAccount: true,
          phq9Qualified: false,
        };
      }

      const data: ExternalQualificationResponse = await response.json();
      
      return {
        hasLinkedAccount: true,
        phq9Qualified: data.qualifications.phq9 || false,
      };
    } catch (error) {
      // API call failed (timeout, network error, etc.) - default to not qualified
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('External API timeout after 5 seconds');
      } else {
        console.error('External API call failed:', error);
      }
      
      return {
        hasLinkedAccount: true,
        phq9Qualified: false,
      };
    }
  } catch (error) {
    // Database error or other unexpected error - default to not qualified
    console.error('Error checking user qualification:', error);
    return {
      hasLinkedAccount: false,
      phq9Qualified: false,
    };
  }
}

/**
 * Checks if a user is qualified to administer PHQ-9 assessments.
 * This is a convenience function that returns only the qualification status.
 * 
 * @param userId - The ID of the user to check
 * @returns true if the user is qualified to administer PHQ-9 assessments, false otherwise
 */
export async function isUserPHQ9Qualified(userId: number): Promise<boolean> {
  const status = await getUserQualificationStatus(userId);
  return status.phq9Qualified;
}
