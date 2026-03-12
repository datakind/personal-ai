import { describe, it, expect, beforeEach } from '@jest/globals';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { cleanupExpiredSessions } from '@/lib/cleanup';
import { eq } from 'drizzle-orm';

describe('Session Cleanup', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(sessions);
    await db.delete(users);
  });

  it('should delete expired sessions and keep valid ones', async () => {
    // Create a test user
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
    }).returning();

    // Create an expired session (1 day ago)
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      userId: user.id,
      token: 'expired-token',
      expiresAt: expiredDate,
    });

    // Create a valid session (7 days from now)
    const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      userId: user.id,
      token: 'valid-token',
      expiresAt: validDate,
    });

    // Run cleanup
    const deletedCount = await cleanupExpiredSessions();

    // Verify one session was deleted
    expect(deletedCount).toBe(1);

    // Verify expired session is gone
    const expiredSession = await db.query.sessions.findFirst({
      where: eq(sessions.token, 'expired-token'),
    });
    expect(expiredSession).toBeUndefined();

    // Verify valid session still exists
    const validSession = await db.query.sessions.findFirst({
      where: eq(sessions.token, 'valid-token'),
    });
    expect(validSession).toBeDefined();
    expect(validSession?.token).toBe('valid-token');
  });

  it('should return 0 when no expired sessions exist', async () => {
    // Create a test user
    const [user] = await db.insert(users).values({
      email: 'test2@example.com',
    }).returning();

    // Create only valid sessions
    const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      userId: user.id,
      token: 'valid-token-1',
      expiresAt: validDate,
    });

    // Run cleanup
    const deletedCount = await cleanupExpiredSessions();

    // Verify no sessions were deleted
    expect(deletedCount).toBe(0);

    // Verify session still exists
    const allSessions = await db.query.sessions.findMany();
    expect(allSessions).toHaveLength(1);
  });

  it('should handle multiple expired sessions', async () => {
    // Create a test user
    const [user] = await db.insert(users).values({
      email: 'test3@example.com',
    }).returning();

    // Create multiple expired sessions
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.insert(sessions).values([
      {
        userId: user.id,
        token: 'expired-token-1',
        expiresAt: expiredDate,
      },
      {
        userId: user.id,
        token: 'expired-token-2',
        expiresAt: expiredDate,
      },
      {
        userId: user.id,
        token: 'expired-token-3',
        expiresAt: expiredDate,
      },
    ]);

    // Run cleanup
    const deletedCount = await cleanupExpiredSessions();

    // Verify all expired sessions were deleted
    expect(deletedCount).toBe(3);

    // Verify no sessions remain
    const allSessions = await db.query.sessions.findMany();
    expect(allSessions).toHaveLength(0);
  });
});
