'use server'

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';

/**
 * Validates email format using regex
 * Requirements: 1.3, 9.1
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Authenticates a user with email-based immediate trust model
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.5, 3.4, 3.5, 4.5, 9.1, 9.3
 */
export async function authenticate(formData: FormData, returnUrl?: string) {
  const email = formData.get('email') as string;

  // Validate email format (Requirements 1.3, 9.1)
  if (!isValidEmail(email)) {
    return { error: 'Invalid email format' };
  }

  try {
    // Normalize email to lowercase (Requirement 1.2)
    const normalizedEmail = email.toLowerCase();

    // Find or create user (Requirements 1.1, 1.2, 1.4)
    let user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      const [newUser] = await db.insert(users)
        .values({ email: normalizedEmail })
        .returning();
      user = newUser;
    }

    // Generate cryptographically secure session token (Requirement 2.5)
    const token = randomBytes(32).toString('base64url');
    
    // Calculate 7-day expiration timestamp (Requirement 2.2)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Insert session record into database (Requirements 2.1, 2.3)
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Set HTTP-only session cookie with secure flags (Requirements 3.4, 3.5)
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    // TODO: If user has OAuth token, query Storage API for new training records (Requirement 2.4)

  } catch (error) {
    // Log detailed error server-side without exposing internal details to client (Requirement 9.3)
    console.error('Authentication error:', error);
    return { error: 'Authentication failed. Please try again.' };
  }

  // Redirect to returnUrl if provided, otherwise to dashboard (Requirement 4.5)
  redirect(returnUrl || '/dashboard');
}

/**
 * Logs out the current user by deleting session and clearing cookie
 * Requirements: 3.3, 5.1, 5.2, 5.3, 5.4, 9.3
 */
export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (token) {
    try {
      // Delete session from database (Requirement 5.1)
      await db.delete(sessions).where(eq(sessions.token, token));
    } catch (error) {
      // Log detailed error server-side, handle logout gracefully even if session is invalid (Requirements 5.4, 9.3)
      console.error('Logout error:', error);
    }
  }

  // Clear session cookie (Requirement 5.2)
  cookieStore.delete('session');
  
  // Redirect to login page (Requirement 5.3)
  redirect('/login');
}
