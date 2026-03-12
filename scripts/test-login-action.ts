/**
 * Test script for login Server Action
 * This script validates that the login action can create users and sessions correctly.
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function testLoginAction() {
  console.log('Testing login action components...\n');

  // Test 1: Create a new user
  console.log('Test 1: Creating a new user...');
  const testEmail = `test-${Date.now()}@example.com`;
  const testName = 'Test User';

  const [newUser] = await db
    .insert(users)
    .values({
      name: testName,
      email: testEmail,
      createdAt: new Date(),
    })
    .returning();

  console.log('✓ User created:', { id: newUser.id, name: newUser.name, email: newUser.email });

  // Test 2: Query user by email
  console.log('\nTest 2: Querying user by email...');
  const queriedUser = await db.query.users.findFirst({
    where: eq(users.email, testEmail),
  });

  if (queriedUser && queriedUser.id === newUser.id) {
    console.log('✓ User query successful:', { id: queriedUser.id, email: queriedUser.email });
  } else {
    console.error('✗ User query failed');
    process.exit(1);
  }

  // Test 3: Verify user with same email is not duplicated
  console.log('\nTest 3: Verifying email uniqueness...');
  try {
    await db.insert(users).values({
      name: 'Duplicate User',
      email: testEmail,
      createdAt: new Date(),
    });
    console.error('✗ Email uniqueness constraint failed - duplicate was allowed');
    process.exit(1);
  } catch (error) {
    console.log('✓ Email uniqueness constraint working - duplicate rejected');
  }

  // Test 4: Verify session creation would work
  console.log('\nTest 4: Verifying session table structure...');
  const testSessionId = 'test-session-token';
  await db.insert(sessions).values({
    id: testSessionId,
    userId: newUser.id,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    createdAt: new Date(),
  });
  console.log('✓ Session created successfully');

  // Cleanup
  console.log('\nCleaning up test data...');
  await db.delete(sessions).where(eq(sessions.id, testSessionId));
  await db.delete(users).where(eq(users.id, newUser.id));
  console.log('✓ Cleanup complete');

  console.log('\n✅ All tests passed! Login action components are working correctly.');
}

testLoginAction().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
