import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@/db/schema';

/**
 * Check if a user needs email prompt (has placeholder email from migration)
 * Requirements: 6.4
 */
export function needsEmailPrompt(email: string): boolean {
  return email.startsWith('migrated_user_') && email.endsWith('@migration.local');
}

/**
 * Retrieves the current session from cookies and validates it against the database.
 * 
 * @returns Session object with user data if valid, null otherwise
 * 
 * Validates:
 * - Requirements 3.1: Valid session authenticates request
 * - Requirements 4.2: Session verification on protected routes
 * - Requirements 4.3: Session cookies are HTTP-only
 * - Requirements 4.4: Missing/invalid tokens treated as unauthenticated
 */
export async function getSession(): Promise<{ user: User } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.token, token),
      gt(sessions.expiresAt, new Date())
    ),
    with: {
      user: true,
    },
  });

  if (!session) return null;

  return { user: session.user };
}

/**
 * Requires a valid session to proceed. Redirects to login page if no valid session exists.
 * Optionally checks if user needs email prompt and redirects to email prompt page.
 * 
 * @param checkEmailPrompt - If true, redirects migrated users to email prompt page
 * @returns Session object with user data
 * @throws Redirects to /login if session is invalid or missing
 * @throws Redirects to /email-prompt if user needs to provide email
 * 
 * Validates:
 * - Requirements 3.2: Expired sessions rejected
 * - Requirements 4.1: Unauthenticated requests redirect to login
 * - Requirements 4.4: Missing/invalid tokens treated as unauthenticated
 * - Requirements 6.4: Prompt migrated users for email on first access
 * - Requirements 9.2: Session expiration message on expired session redirect
 */
export async function requireSession(
  checkEmailPrompt: boolean = true
): Promise<{ user: User }> {
  const session = await getSession();
  if (!session) {
    // Redirect with session expired flag (Requirements 9.2)
    redirect('/login?sessionExpired=true');
  }

  // Check if migrated user needs to provide email
  if (checkEmailPrompt && needsEmailPrompt(session.user.email)) {
    redirect('/email-prompt');
  }

  return session;
}
