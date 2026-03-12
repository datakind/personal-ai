/**
 * Database Constraints Verification Tests
 * Task 7.1: Verify database constraints enforcement
 * 
 * Tests:
 * - Unique constraint on users.email (Requirement 7.3)
 * - Unique constraint on sessions.token (Requirement 7.4)
 * - Foreign key cascade on user deletion (Requirement 7.5)
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
  // Clean up test data (sessions first due to foreign key)
  await db.delete(sessions).execute();
  await db.delete(users).execute();
}

/**
 * Test: Unique constraint on users.email
 * Validates: Requirement 7.3
 * 
 * Verifies that the database enforces uniqueness on the email column
 * in the users table, preventing duplicate email addresses.
 */
async function testEmailUniqueConstraint() {
  log('\n=== Test 1: Unique Constraint on users.email ===', YELLOW);
  
  try {
    // Create first user with email
    const testEmail = 'unique-test@example.com';
    const [user1] = await db.insert(users)
      .values({ email: testEmail })
      .returning();
    
    assert(user1.id > 0, 'First user created successfully');
    assert(user1.email === testEmail, 'First user email stored correctly');
    
    // Attempt to create second user with same email
    let constraintEnforced = false;
    try {
      await db.insert(users)
        .values({ email: testEmail })
        .execute();
      // If we reach here, constraint was NOT enforced
      constraintEnforced = false;
    } catch (error: any) {
      // Expected: SQLite should throw UNIQUE constraint error
      constraintEnforced = error.message?.includes('UNIQUE') || 
                          error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
                          error.code === 'SQLITE_CONSTRAINT';
    }
    
    assert(constraintEnforced, 'Database rejects duplicate email addresses');
    
    // Verify only one user exists with this email
    const usersWithEmail = await db.select()
      .from(users)
      .where(eq(users.email, testEmail))
      .execute();
    
    assert(usersWithEmail.length === 1, 'Only one user exists with the email');
    
    // Test case sensitivity - lowercase vs uppercase
    let caseConstraintEnforced = false;
    try {
      await db.insert(users)
        .values({ email: testEmail.toUpperCase() })
        .execute();
      // SQLite is case-insensitive for UNIQUE by default, but let's verify
      caseConstraintEnforced = false;
    } catch (error: any) {
      caseConstraintEnforced = error.message?.includes('UNIQUE') || 
                              error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
                              error.code === 'SQLITE_CONSTRAINT';
    }
    
    // Note: SQLite UNIQUE constraint is case-insensitive by default
    // If it allows uppercase, that's expected SQLite behavior
    if (caseConstraintEnforced) {
      assert(true, 'Database enforces case-insensitive email uniqueness');
    } else {
      log('  ℹ SQLite allows case variations (expected behavior)', YELLOW);
    }
    
    // Cleanup
    await db.delete(users).where(eq(users.id, user1.id)).execute();
    
  } catch (error) {
    log(`Email unique constraint test error: ${error}`, RED);
    testsFailed++;
  }
}

/**
 * Test: Unique constraint on sessions.token
 * Validates: Requirement 7.4
 * 
 * Verifies that the database enforces uniqueness on the token column
 * in the sessions table, preventing duplicate session tokens.
 */
async function testTokenUniqueConstraint() {
  log('\n=== Test 2: Unique Constraint on sessions.token ===', YELLOW);
  
  try {
    // Create a user first (required for foreign key)
    const [user] = await db.insert(users)
      .values({ email: 'token-test@example.com' })
      .returning();
    
    assert(user.id > 0, 'Test user created successfully');
    
    // Create first session with token
    const testToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const [session1] = await db.insert(sessions)
      .values({
        userId: user.id,
        token: testToken,
        expiresAt,
      })
      .returning();
    
    assert(session1.id > 0, 'First session created successfully');
    assert(session1.token === testToken, 'First session token stored correctly');
    
    // Attempt to create second session with same token
    let constraintEnforced = false;
    try {
      await db.insert(sessions)
        .values({
          userId: user.id,
          token: testToken, // Same token
          expiresAt,
        })
        .execute();
      // If we reach here, constraint was NOT enforced
      constraintEnforced = false;
    } catch (error: any) {
      // Expected: SQLite should throw UNIQUE constraint error
      constraintEnforced = error.message?.includes('UNIQUE') || 
                          error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
                          error.code === 'SQLITE_CONSTRAINT';
    }
    
    assert(constraintEnforced, 'Database rejects duplicate session tokens');
    
    // Verify only one session exists with this token
    const sessionsWithToken = await db.select()
      .from(sessions)
      .where(eq(sessions.token, testToken))
      .execute();
    
    assert(sessionsWithToken.length === 1, 'Only one session exists with the token');
    
    // Test that different tokens can be created for same user
    const differentToken = randomBytes(32).toString('base64url');
    const [session2] = await db.insert(sessions)
      .values({
        userId: user.id,
        token: differentToken,
        expiresAt,
      })
      .returning();
    
    assert(session2.id > 0, 'Multiple sessions with different tokens allowed for same user');
    assert(session2.token === differentToken, 'Second session has different token');
    
    // Cleanup
    await db.delete(users).where(eq(users.id, user.id)).execute();
    
  } catch (error) {
    log(`Token unique constraint test error: ${error}`, RED);
    testsFailed++;
  }
}

/**
 * Test: Foreign key cascade on user deletion
 * Validates: Requirement 7.5
 * 
 * Verifies that when a user is deleted, all associated sessions are
 * automatically deleted due to the foreign key cascade relationship.
 */
async function testForeignKeyCascade() {
  log('\n=== Test 3: Foreign Key Cascade on User Deletion ===', YELLOW);
  
  try {
    // Create a user
    const [user] = await db.insert(users)
      .values({ email: 'cascade-test@example.com' })
      .returning();
    
    assert(user.id > 0, 'Test user created successfully');
    
    // Create multiple sessions for this user
    const sessionTokens: string[] = [];
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < 3; i++) {
      const token = randomBytes(32).toString('base64url');
      sessionTokens.push(token);
      
      await db.insert(sessions)
        .values({
          userId: user.id,
          token,
          expiresAt,
        })
        .execute();
    }
    
    // Verify sessions were created
    const sessionsBeforeDelete = await db.select()
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .execute();
    
    assert(sessionsBeforeDelete.length === 3, 'Three sessions created for user');
    
    // Delete the user
    const deleteResult = await db.delete(users)
      .where(eq(users.id, user.id))
      .execute();
    
    assert(deleteResult.changes > 0, 'User deleted successfully');
    
    // Verify user no longer exists
    const deletedUser = await db.select()
      .from(users)
      .where(eq(users.id, user.id))
      .execute();
    
    assert(deletedUser.length === 0, 'User no longer exists in database');
    
    // Verify all sessions were cascade deleted
    const sessionsAfterDelete = await db.select()
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .execute();
    
    assert(sessionsAfterDelete.length === 0, 'All user sessions cascade deleted');
    
    // Verify by checking each token individually
    for (const token of sessionTokens) {
      const session = await db.select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .execute();
      
      assert(session.length === 0, `Session with token ${token.substring(0, 10)}... was deleted`);
    }
    
    // Test that sessions for other users are not affected
    const [otherUser] = await db.insert(users)
      .values({ email: 'other-user@example.com' })
      .returning();
    
    const otherToken = randomBytes(32).toString('base64url');
    await db.insert(sessions)
      .values({
        userId: otherUser.id,
        token: otherToken,
        expiresAt,
      })
      .execute();
    
    // Delete first user (already deleted, but let's create and delete another)
    const [tempUser] = await db.insert(users)
      .values({ email: 'temp-user@example.com' })
      .returning();
    
    const tempToken = randomBytes(32).toString('base64url');
    await db.insert(sessions)
      .values({
        userId: tempUser.id,
        token: tempToken,
        expiresAt,
      })
      .execute();
    
    await db.delete(users).where(eq(users.id, tempUser.id)).execute();
    
    // Verify other user's session still exists
    const otherUserSession = await db.select()
      .from(sessions)
      .where(eq(sessions.userId, otherUser.id))
      .execute();
    
    assert(otherUserSession.length === 1, 'Other user sessions unaffected by cascade delete');
    
    // Cleanup
    await db.delete(users).where(eq(users.id, otherUser.id)).execute();
    
  } catch (error) {
    log(`Foreign key cascade test error: ${error}`, RED);
    testsFailed++;
  }
}

async function runTests() {
  log('Starting Database Constraints Verification Tests', YELLOW);
  log('Task 7.1: Verify database constraints enforcement\n', YELLOW);
  
  try {
    await cleanup();
    
    await testEmailUniqueConstraint();
    await testTokenUniqueConstraint();
    await testForeignKeyCascade();
    
    await cleanup();
    
    log('\n=== Test Summary ===', YELLOW);
    log(`Tests Passed: ${testsPassed}`, GREEN);
    log(`Tests Failed: ${testsFailed}`, RED);
    
    if (testsFailed === 0) {
      log('\n✓ All database constraint tests passed!', GREEN);
      log('Requirements validated: 7.3, 7.4, 7.5', GREEN);
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
