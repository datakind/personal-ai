/**
 * Test script for logout Server Action
 * 
 * This script tests the logout functionality by:
 * 1. Creating a test user and session
 * 2. Verifying the session exists
 * 3. Simulating logout by invalidating the session
 * 4. Verifying the session is removed
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, validateSession, invalidateSession } from '@/lib/auth';

async function testLogout() {
  console.log('🧪 Testing logout functionality...\n');

  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const [testUser] = await db
      .insert(users)
      .values({
        name: 'Logout Test User',
        email: `logout-test-${Date.now()}@example.com`,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ Created user: ${testUser.name} (ID: ${testUser.id})\n`);

    // Step 2: Create a session for the user
    console.log('2️⃣ Creating session...');
    const sessionToken = await createSession(testUser.id);
    console.log(`✅ Created session with token: ${sessionToken.substring(0, 20)}...\n`);

    // Step 3: Verify session exists and is valid
    console.log('3️⃣ Validating session...');
    const validationResult = await validateSession(sessionToken);
    if (!validationResult) {
      throw new Error('Session validation failed - session should be valid');
    }
    console.log(`✅ Session is valid for user: ${validationResult.user.name}\n`);

    // Step 4: Simulate logout by invalidating the session
    console.log('4️⃣ Invalidating session (logout)...');
    await invalidateSession(sessionToken);
    console.log('✅ Session invalidated\n');

    // Step 5: Verify session no longer exists
    console.log('5️⃣ Verifying session is removed...');
    const postLogoutValidation = await validateSession(sessionToken);
    if (postLogoutValidation !== null) {
      throw new Error('Session still exists after logout - should be null');
    }
    console.log('✅ Session successfully removed from database\n');

    // Step 6: Verify session record is deleted from database
    console.log('6️⃣ Checking database for session record...');
    const sessionRecord = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionToken),
    });
    if (sessionRecord) {
      throw new Error('Session record still exists in database');
    }
    console.log('✅ Session record deleted from database\n');

    // Cleanup: Remove test user
    console.log('🧹 Cleaning up test user...');
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log('✅ Test user removed\n');

    console.log('✨ All logout tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testLogout();
