'use server';

/**
 * Server actions for email prompt functionality
 * 
 * Handles updating migrated user emails with validation
 * 
 * Requirements: 6.4, 9.1, 9.3
 */

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function updateEmailForMigratedUser(
  formData: FormData,
  userId: number,
  returnUrl?: string
) {
  const email = formData.get('email') as string;

  // Validate email format (Requirements 9.1)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { error: 'Invalid email format' };
  }

  try {
    const normalizedEmail = email.toLowerCase();

    // Check if email is already in use by another user
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.email, normalizedEmail), ne(users.id, userId)),
    });

    if (existingUser) {
      return { error: 'Email address already in use' };
    }

    // Update user email
    await db
      .update(users)
      .set({
        email: normalizedEmail,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`Updated migrated user ${userId} with email ${normalizedEmail}`);
  } catch (error) {
    // Log detailed error server-side without exposing internal details to client (Requirement 9.3)
    console.error('Failed to update user email:', error);
    return { error: 'Failed to update email. Please try again.' };
  }

  // Redirect to dashboard or return URL
  redirect(returnUrl || '/dashboard');
}
