/**
 * Integration test for logout Server Action
 * 
 * This script simulates a complete login/logout flow:
 * 1. Creates a test user
 * 2. Creates a session (simulating login)
 * 3. Validates the session exists
 * 4. Invalidates the session (simulating logout)
 * 5. Verifies the session is completely removed
 * 6. Verifies subsequent validation fails
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, validateSession, invalidateSession } from '@/lib/auth';

async function testLogoutIntegration() {
  console.log('🔐 Testing complete login/logout integration...\n');

  try {
    // Step 1: Create test user (simulating registration)
    console.log('1️⃣ Creating test user...');
    const [user] = await db
      .insert(users)
      .values({
        name: 'Integration Test User',
        email: `integration-${Date.now()}@example.com`,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ User created: ${user.name} (ID: ${user.id})\n`);

    // Step 2: Login - create session
    console.log('2️⃣ Simulating login - creating session...');
    const token = await createSession(user.id);
    console.log(`✅ Session created: ${token.substring(0, 20)}...\n`);

    // Step 3: Verify user can access protected resources
    console.log('3️⃣ Verifying authenticated access...');
    const authCheck1 = await validateSession(token);
    if (!authCheck1) {
      throw new Error('Authentication failed - user should be logged in');
    }
    console.log(`✅ User authenticated: ${authCheck1.user.name}\n`);

    // Step 4: Check session exists in database
    console.log('4️⃣ Verifying session in database...');
    const sessionInDb = await db.query.sessions.findFirst({
      where: eq(sessions.id, token),
    });
    if (!sessionInDb) {
      throw new Error('Session not found in database');
    }
    console.log(`✅ Session found in database (User ID: ${sessionInDb.userId})\n`);

    // Step 5: Logout - invalidate session
    console.log('5️⃣ Simulating logout - invalidating session...');
    await invalidateSession(token);
    console.log('✅ Logout completed\n');

    // Step 6: Verify session is removed from database
    console.log('6️⃣ Verifying session removed from database...');
    const sessionAfterLogout = await db.query.sessions.findFirst({
      where: eq(sessions.id, token),
    });
    if (sessionAfterLogout) {
      throw new Error('Session still exists after logout');
    }
    console.log('✅ Session removed from database\n');

    // Step 7: Verify authentication fails after logout
    console.log('7️⃣ Verifying authentication fails after logout...');
    const authCheck2 = await validateSession(token);
    if (authCheck2 !== null) {
      throw new Error('Authentication succeeded after logout - should fail');
    }
    console.log('✅ Authentication correctly fails after logout\n');

    // Step 8: Verify user still exists (only session should be removed)
    console.log('8️⃣ Verifying user record still exists...');
    const userStillExists = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    if (!userStillExists) {
      throw new Error('User was deleted - only session should be removed');
    }
    console.log(`✅ User record intact: ${userStillExists.name}\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await db.delete(users).where(eq(users.id, user.id));
    console.log('✅ Test data cleaned up\n');

    console.log('✨ All integration tests passed!');
    console.log('📋 Summary:');
    console.log('   - Login creates valid session ✓');
    console.log('   - Session stored in database ✓');
    console.log('   - Logout removes session ✓');
    console.log('   - Authentication fails after logout ✓');
    console.log('   - User record preserved ✓');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

testLogoutIntegration();
