/**
 * Test script for cleanupExpiredSessions function
 * Run with: npx tsx scripts/test-cleanup-expired-sessions.ts
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { createSession, cleanupExpiredSessions } from '@/lib/auth';
import { eq } from 'drizzle-orm';

async function testCleanupExpiredSessions() {
  console.log('🧪 Testing cleanupExpiredSessions function...\n');

  // Clean up any existing test data
  await db.delete(sessions).execute();
  await db.delete(users).where(eq(users.email, 'test@example.com')).execute();

  // Test 1: Create a test user
  console.log('1️⃣ Creating test user...');
  const [testUser] = await db
    .insert(users)
    .values({
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    })
    .returning();
  console.log(`✅ Created user with ID: ${testUser.id}\n`);

  // Test 2: Create a valid (non-expired) session
  console.log('2️⃣ Creating valid session...');
  const validToken = await createSession(testUser.id);
  console.log(`✅ Created valid session with token: ${validToken.substring(0, 20)}...\n`);

  // Test 3: Create multiple expired sessions
  console.log('3️⃣ Creating expired sessions...');
  const expiredToken1 = 'expired-test-token-1';
  const expiredToken2 = 'expired-test-token-2';
  const expiredToken3 = 'expired-test-token-3';
  const pastDate1 = new Date(Date.now() - 1000); // 1 second ago
  const pastDate2 = new Date(Date.now() - 60000); // 1 minute ago
  const pastDate3 = new Date(Date.now() - 3600000); // 1 hour ago

  await db.insert(sessions).values([
    {
      id: expiredToken1,
      userId: testUser.id,
      expiresAt: pastDate1,
      createdAt: new Date(Date.now() - 10000),
    },
    {
      id: expiredToken2,
      userId: testUser.id,
      expiresAt: pastDate2,
      createdAt: new Date(Date.now() - 70000),
    },
    {
      id: expiredToken3,
      userId: testUser.id,
      expiresAt: pastDate3,
      createdAt: new Date(Date.now() - 7200000),
    },
  ]);
  console.log('✅ Created 3 expired sessions\n');

  // Test 4: Verify all sessions exist before cleanup
  console.log('4️⃣ Verifying sessions before cleanup...');
  const sessionsBefore = await db.query.sessions.findMany();
  console.log(`   Total sessions: ${sessionsBefore.length}`);
  console.log(`   Expected: 4 (1 valid + 3 expired)\n`);
  
  if (sessionsBefore.length !== 4) {
    console.error('❌ Expected 4 sessions before cleanup!\n');
    process.exit(1);
  }
  console.log('✅ Correct number of sessions before cleanup\n');

  // Test 5: Run cleanup function
  console.log('5️⃣ Running cleanupExpiredSessions...');
  await cleanupExpiredSessions();
  console.log('✅ Cleanup function executed\n');

  // Test 6: Verify only valid session remains
  console.log('6️⃣ Verifying sessions after cleanup...');
  const sessionsAfter = await db.query.sessions.findMany();
  console.log(`   Total sessions: ${sessionsAfter.length}`);
  console.log(`   Expected: 1 (only valid session)\n`);
  
  if (sessionsAfter.length !== 1) {
    console.error('❌ Expected 1 session after cleanup!\n');
    process.exit(1);
  }
  console.log('✅ Correct number of sessions after cleanup\n');

  // Test 7: Verify the remaining session is the valid one
  console.log('7️⃣ Verifying remaining session is the valid one...');
  const remainingSession = sessionsAfter[0];
  if (remainingSession.id === validToken) {
    console.log('✅ Valid session was preserved');
    console.log(`   Token: ${remainingSession.id.substring(0, 20)}...`);
    console.log(`   Expires: ${remainingSession.expiresAt}\n`);
  } else {
    console.error('❌ Wrong session was preserved!\n');
    process.exit(1);
  }

  // Test 8: Run cleanup again (should be idempotent)
  console.log('8️⃣ Testing idempotency (running cleanup again)...');
  await cleanupExpiredSessions();
  const sessionsAfterSecondCleanup = await db.query.sessions.findMany();
  if (sessionsAfterSecondCleanup.length === 1) {
    console.log('✅ Cleanup is idempotent (still 1 session)\n');
  } else {
    console.error('❌ Cleanup affected valid sessions!\n');
    process.exit(1);
  }

  // Test 9: Test cleanup with no expired sessions
  console.log('9️⃣ Testing cleanup with no expired sessions...');
  await db.delete(sessions).execute();
  await cleanupExpiredSessions();
  const sessionsAfterEmptyCleanup = await db.query.sessions.findMany();
  if (sessionsAfterEmptyCleanup.length === 0) {
    console.log('✅ Cleanup works correctly with no sessions\n');
  } else {
    console.error('❌ Unexpected sessions found!\n');
    process.exit(1);
  }

  // Clean up
  console.log('🧹 Cleaning up test data...');
  await db.delete(sessions).execute();
  await db.delete(users).where(eq(users.id, testUser.id)).execute();
  console.log('✅ Cleanup complete\n');

  console.log('🎉 All tests passed!');
}

testCleanupExpiredSessions().catch((error) => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
