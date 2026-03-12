import { db } from '@/db';
import { sessions } from '@/db/schema';
import { lt } from 'drizzle-orm';

/**
 * Deletes all expired sessions from the database.
 * 
 * This function removes sessions where the expiration timestamp is before
 * the current time, preventing accumulation of stale session data.
 * 
 * @returns The number of expired sessions deleted
 * 
 * Validates:
 * - Requirements 8.1: Cleanup process deletes expired sessions
 * - Requirements 8.2: Deletes sessions where expires_at is before current timestamp
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()))
      .returning();

    const deletedCount = result.length;
    
    if (deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${deletedCount} expired session(s)`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('[Cleanup] Error deleting expired sessions:', error);
    throw error;
  }
}
