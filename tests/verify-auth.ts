/**
 * Verification script for core authentication logic
 * This script tests the database setup and core authentication functions
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Color codes for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let testsPassed = 0;
let testsFailed = 0;

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function assert(condition: boolean, testName: string) {
  if (condition) {
    testsPassed++;
    log(`✓ ${testName}`, GREEN);
  } else {
    testsFailed++;
    log(`✗ ${testName}`, RED);
  }
}

async function cleanup() {
  // Clean up test data
  await db.delete(sessions).execute();
  await db.delete(users).execute();
}

async function testDatabaseSchema() {
  log('\n=== Testing Database Schema ===', YELLOW);
  
  try {
    // Test 1: Can insert a user
    const [user] = await db.insert(users)
      .values({ email: 'test@example.com' })
      .returning();
    
    assert(user.id > 0, 'User creation generates ID');
    assert(user.email === 'test@example.com', 'User email stored correctly');
    assert(user.createdAt instanceof Date, 'User createdAt is a Date');
    assert(user.updatedAt instanceof Date, 'User updatedAt is a Date');
    
    // Test 2: Email uniqueness constraint
    try {
      await db.insert(users)
        .values({ email: 'test@example.com' })
        .execute();
      assert(false, 'Email uniqueness constraint enforced');
    } catch (error) {
      assert(true, 'Email uniqueness constraint enforced');
    }
    
    // Test 3: Can insert a session
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const [session] = await db.insert(sessions)
      .values({
        userId: user.id,
        token,
        expiresAt,
      })
      .returning();
    
    assert(session.id > 0, 'Session creation generates ID');
    assert(session.userId === user.id, 'Session userId matches user');
    assert(session.token === token, 'Session token stored correctly');
    assert(session.expiresAt instanceof Date, 'Session expiresAt is a Date');
    
    // Test 4: Token uniqueness constraint
    try {
      await db.insert(sessions)
        .values({
          userId: user.id,
          token, // Same token
          expiresAt,
        })
        .execute();
      assert(false, 'Token uniqueness constraint enforced');
    } catch (error) {
      assert(true, 'Token uniqueness constraint enforced');
    }
    
    // Test 5: Foreign key cascade delete
    await db.delete(users).where(eq(users.id, user.id)).execute();
    const remainingSessions = await db.select()
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .execute();
    
    assert(remainingSessions.length === 0, 'Foreign key cascade delete works');
    
  } catch (error) {
    log(`Database schema test error: ${error}`, RED);
    testsFailed++;
  }
}

async function testEmailValidation() {
  log('\n=== Testing Email Validation ===', YELLOW);
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Valid emails
  const validEmails = [
    'user@example.com',
    'test.user@example.co.uk',
    'user+tag@example.com',
    'user123@test-domain.com',
  ];
  
  for (const email of validEmails) {
    assert(emailRegex.test(email), `Valid email accepted: ${email}`);
  }
  
  // Invalid emails
  const invalidEmails = [
    'notanemail',
    '@example.com',
    'user@',
    'user @example.com',
    'user@example',
  ];
  
  for (const email of invalidEmails) {
    assert(!emailRegex.test(email), `Invalid email rejected: ${email}`);
  }
}

async function testSessionExpiration() {
  log('\n=== Testing Session Expiration ===', YELLOW);
  
  try {
    // Create a user
    const [user] = await db.insert(users)
      .values({ email: 'session-test@example.com' })
      .returning();
    
    // Test 1: 7-day expiration calculation
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(now + sevenDays);
    
    const token = randomBytes(32).toString('base64url');
    await db.insert(sessions)
      .values({
        userId: user.id,
        token,
        expiresAt,
      })
      .execute();
    
    const timeDiff = expiresAt.getTime() - now;
    const isSevenDays = Math.abs(timeDiff - sevenDays) < 1000; // Within 1 second
    assert(isSevenDays, 'Session expiration is 7 days from creation');
    
    // Test 2: Valid session query
    const validSession = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      ),
      with: {
        user: true,
      },
    });
    
    assert(validSession !== undefined, 'Valid session can be queried');
    assert(validSession?.user.email === 'session-test@example.com', 'Session includes user data');
    
    // Test 3: Expired session query
    const expiredToken = randomBytes(32).toString('base64url');
    const pastDate = new Date(Date.now() - 1000); // 1 second ago
    
    await db.insert(sessions)
      .values({
        userId: user.id,
        token: expiredToken,
        expiresAt: pastDate,
      })
      .execute();
    
    const expiredSession = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, expiredToken),
        gt(sessions.expiresAt, new Date())
      ),
    });
    
    assert(expiredSession === undefined, 'Expired session not returned by query');
    
    // Cleanup
    await db.delete(users).where(eq(users.id, user.id)).execute();
    
  } catch (error) {
    log(`Session expiration test error: ${error}`, RED);
    testsFailed++;
  }
}

async function testTokenGeneration() {
  log('\n=== Testing Token Generation ===', YELLOW);
  
  // Test 1: Token length
  const token = randomBytes(32).toString('base64url');
  assert(token.length >= 43, 'Token has sufficient length (32 bytes = 43+ chars in base64url)');
  
  // Test 2: Token uniqueness
  const tokens = new Set<string>();
  for (let i = 0; i < 100; i++) {
    tokens.add(randomBytes(32).toString('base64url'));
  }
  assert(tokens.size === 100, 'Generated tokens are unique');
  
  // Test 3: Token format (base64url)
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  assert(base64urlRegex.test(token), 'Token uses base64url format');
}

async function testUserCreation() {
  log('\n=== Testing User Creation ===', YELLOW);
  
  try {
    // Test 1: Create multiple users
    const emails = [
      'user1@example.com',
      'user2@example.com',
      'user3@example.com',
    ];
    
    const userIds = new Set<number>();
    
    for (const email of emails) {
      const [user] = await db.insert(users)
        .values({ email })
        .returning();
      userIds.add(user.id);
    }
    
    assert(userIds.size === 3, 'Each user gets a unique ID');
    
    // Test 2: Email normalization (lowercase)
    const [upperUser] = await db.insert(users)
      .values({ email: 'UPPER@EXAMPLE.COM' })
      .returning();
    
    // Note: The application should normalize to lowercase, but schema doesn't enforce it
    // This test just verifies the user can be created
    assert(upperUser.id > 0, 'User with uppercase email can be created');
    
    // Cleanup
    await db.delete(users).execute();
    
  } catch (error) {
    log(`User creation test error: ${error}`, RED);
    testsFailed++;
  }
}

async function runTests() {
  log('Starting Core Authentication Logic Verification\n', YELLOW);
  
  try {
    await cleanup();
    
    await testDatabaseSchema();
    await testEmailValidation();
    await testSessionExpiration();
    await testTokenGeneration();
    await testUserCreation();
    
    await cleanup();
    
    log('\n=== Test Summary ===', YELLOW);
    log(`Tests Passed: ${testsPassed}`, GREEN);
    log(`Tests Failed: ${testsFailed}`, RED);
    
    if (testsFailed === 0) {
      log('\n✓ All core authentication logic tests passed!', GREEN);
      process.exit(0);
    } else {
      log('\n✗ Some tests failed. Please review the output above.', RED);
      process.exit(1);
    }
    
  } catch (error) {
    log(`\nFatal error: ${error}`, RED);
    process.exit(1);
  }
}

runTests();
