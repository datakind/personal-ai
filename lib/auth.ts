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
 */
export async function createSession(userId: number): Promise<string> {
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
    await db.delete(sessions).where(eq(sessions.id, token));
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
}

/**
 * Invalidates a session by deleting it from the database.
 * Used during logout to terminate a user's session.
 * 
 * @param token - The session token to invalidate
 */
export async function invalidateSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, token));
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
  const now = new Date();
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
}
