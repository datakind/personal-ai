/**
 * Test script for validateSession function
 * Run with: npx tsx scripts/test-validate-session.ts
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { createSession, validateSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

async function testValidateSession() {
  console.log('🧪 Testing validateSession function...\n');

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

  // Test 3: Validate the session (should succeed)
  console.log('3️⃣ Validating active session...');
  const validResult = await validateSession(token);
  if (validResult && validResult.user.id === testUser.id) {
    console.log('✅ Session validation successful!');
    console.log(`   User: ${validResult.user.name} (${validResult.user.email})`);
    console.log(`   Session expires: ${validResult.session.expiresAt}\n`);
  } else {
    console.error('❌ Session validation failed!\n');
    process.exit(1);
  }

  // Test 4: Validate with invalid token (should return null)
  console.log('4️⃣ Validating with invalid token...');
  const invalidResult = await validateSession('invalid-token-12345');
  if (invalidResult === null) {
    console.log('✅ Correctly returned null for invalid token\n');
  } else {
    console.error('❌ Should have returned null for invalid token!\n');
    process.exit(1);
  }

  // Test 5: Create an expired session and validate it
  console.log('5️⃣ Testing expired session cleanup...');
  const expiredToken = 'expired-test-token';
  const pastDate = new Date(Date.now() - 1000); // 1 second ago
  await db.insert(sessions).values({
    id: expiredToken,
    userId: testUser.id,
    expiresAt: pastDate,
    createdAt: new Date(Date.now() - 10000),
  });
  console.log('   Created expired session');

  const expiredResult = await validateSession(expiredToken);
  if (expiredResult === null) {
    console.log('✅ Correctly returned null for expired session');
    
    // Verify the expired session was deleted
    const deletedSession = await db.query.sessions.findFirst({
      where: eq(sessions.id, expiredToken),
    });
    
    if (!deletedSession) {
      console.log('✅ Expired session was deleted from database\n');
    } else {
      console.error('❌ Expired session was not deleted!\n');
      process.exit(1);
    }
  } else {
    console.error('❌ Should have returned null for expired session!\n');
    process.exit(1);
  }

  // Clean up
  console.log('🧹 Cleaning up test data...');
  await db.delete(sessions).execute();
  await db.delete(users).where(eq(users.id, testUser.id)).execute();
  console.log('✅ Cleanup complete\n');

  console.log('🎉 All tests passed!');
}

testValidateSession().catch((error) => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
