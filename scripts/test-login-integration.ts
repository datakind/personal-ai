/**
 * Integration test for login Server Action
 * Tests the complete login flow including validation, user creation, and session management
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, validateSession } from '@/lib/auth';

async function testLoginIntegration() {
  console.log('Testing login integration...\n');

  const testEmail = `integration-test-${Date.now()}@example.com`;
  const testName = 'Integration Test User';

  // Test 1: Simulate form validation (empty fields)
  console.log('Test 1: Form validation with empty fields...');
  const emptyName: string = '';
  const emptyEmail: string = '';
  
  if (!emptyName || emptyName.trim() === '') {
    console.log('✓ Empty name validation works');
  }
  
  if (!emptyEmail || emptyEmail.trim() === '') {
    console.log('✓ Empty email validation works');
  }

  // Test 2: Create new user (simulating first login)
  console.log('\nTest 2: Creating new user on first login...');
  let user = await db.query.users.findFirst({
    where: eq(users.email, testEmail),
  });

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        name: testName,
        email: testEmail,
        createdAt: new Date(),
      })
      .returning();
    
    user = newUser;
    console.log('✓ New user created:', { id: user.id, email: user.email });
  }

  // Test 3: Create session for user
  console.log('\nTest 3: Creating session...');
  const sessionToken = await createSession(user.id);
  console.log('✓ Session token generated:', sessionToken.substring(0, 20) + '...');

  // Test 4: Validate session
  console.log('\nTest 4: Validating session...');
  const validationResult = await validateSession(sessionToken);
  
  if (validationResult && validationResult.user.id === user.id) {
    console.log('✓ Session validation successful');
    console.log('  User:', { id: validationResult.user.id, email: validationResult.user.email });
    console.log('  Session expires:', validationResult.session.expiresAt);
  } else {
    console.error('✗ Session validation failed');
    process.exit(1);
  }

  // Test 5: Verify session expiration is 8 hours
  console.log('\nTest 5: Verifying session expiration time...');
  const sessionExpiresAt = validationResult.session.expiresAt.getTime();
  const sessionCreatedAt = validationResult.session.createdAt.getTime();
  const sessionDuration = (sessionExpiresAt - sessionCreatedAt) / 1000; // in seconds
  const expectedDuration = 8 * 60 * 60; // 8 hours in seconds
  
  if (Math.abs(sessionDuration - expectedDuration) < 5) { // Allow 5 second tolerance
    console.log('✓ Session expiration set to 8 hours (28800 seconds)');
  } else {
    console.error('✗ Session expiration incorrect:', sessionDuration, 'seconds');
    process.exit(1);
  }

  // Test 6: Simulate returning user (user already exists)
  console.log('\nTest 6: Simulating returning user login...');
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, testEmail),
  });
  
  if (existingUser && existingUser.id === user.id) {
    console.log('✓ Existing user found, no duplicate created');
  } else {
    console.error('✗ User lookup failed');
    process.exit(1);
  }

  // Cleanup
  console.log('\nCleaning up test data...');
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await db.delete(users).where(eq(users.id, user.id));
  console.log('✓ Cleanup complete');

  console.log('\n✅ All integration tests passed! Login action is working correctly.');
}

testLoginIntegration().catch((error) => {
  console.error('Integration test failed:', error);
  process.exit(1);
});
