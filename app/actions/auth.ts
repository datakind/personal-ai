'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, invalidateSession } from '@/lib/auth';

/**
 * Login Server Action
 * Validates user credentials, creates or retrieves user record, and establishes a session.
 * 
 * @param formData - Form data containing name and email fields
 * @returns An object with an error property if validation or authentication fails
 */
export async function login(formData: FormData): Promise<{ error?: string }> {
  // Extract form data
  const name = formData.get('name');
  const email = formData.get('email');

  // Validate form data - ensure fields are non-empty strings
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { error: 'Name is required' };
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return { error: 'Email is required' };
  }

  try {
    // Query user by email
    let user = await db.query.users.findFirst({
      where: eq(users.email, email.trim()),
    });

    // Create user if doesn't exist
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          name: name.trim(),
          email: email.trim(),
          createdAt: new Date(),
        })
        .returning();
      
      user = newUser;
    }

    // Create session for the user
    const sessionToken = await createSession(user.id);

    // Set HTTP-only cookie with session token
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 28800, // 8 hours in seconds
      path: '/',
    });

    // Redirect to home page on success
    redirect('/');
  } catch (error) {
    // Return error on failure
    console.error('Login error:', error);
    return { error: 'An error occurred during login. Please try again.' };
  }
}

/**
 * Logout Server Action
 * Terminates the current user session by invalidating the session token
 * and clearing the session cookie.
 */
export async function logout(): Promise<void> {
  // Get session token from cookies
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  // If session token exists, invalidate it
  if (sessionToken) {
    await invalidateSession(sessionToken);
  }

  // Clear session cookie by setting maxAge to 0
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  // Redirect to login page
  redirect('/login');
}
