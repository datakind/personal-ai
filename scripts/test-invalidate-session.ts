/**
 * Test script for invalidateSession function
 * Run with: npx tsx scripts/test-invalidate-session.ts
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { createSession, invalidateSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

async function testInvalidateSession() {
  console.log('🧪 Testing invalidateSession function...\n');

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

  // Test 2: Create a session for the user
  console.log('2️⃣ Creating session...');
  const token = await createSession(testUser.id);
  console.log(`✅ Created session with token: ${token.substring(0, 20)}...\n`);

  // Test 3: Verify session exists in database
  console.log('3️⃣ Verifying session exists...');
  const sessionBefore = await db.query.sessions.findFirst({
    where: eq(sessions.id, token),
  });
  if (sessionBefore) {
    console.log('✅ Session found in database\n');
  } else {
    console.error('❌ Session not found in database!\n');
    process.exit(1);
  }

  // Test 4: Invalidate the session
  console.log('4️⃣ Invalidating session...');
  await invalidateSession(token);
  console.log('✅ invalidateSession called successfully\n');

  // Test 5: Verify session was deleted from database
  console.log('5️⃣ Verifying session was deleted...');
  const sessionAfter = await db.query.sessions.findFirst({
    where: eq(sessions.id, token),
  });
  if (!sessionAfter) {
    console.log('✅ Session successfully deleted from database\n');
  } else {
    console.error('❌ Session still exists in database!\n');
    process.exit(1);
  }

  // Test 6: Invalidate a non-existent session (should not throw error)
  console.log('6️⃣ Testing invalidation of non-existent session...');
  await invalidateSession('non-existent-token');
  console.log('✅ No error thrown for non-existent session\n');

  // Clean up
  console.log('🧹 Cleaning up test data...');
  await db.delete(users).where(eq(users.id, testUser.id)).execute();
  console.log('✅ Cleanup complete\n');

  console.log('🎉 All tests passed!');
}

testInvalidateSession().catch((error) => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
