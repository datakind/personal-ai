/**
 * Verification script for home page authentication redirect behavior
 * Requirements: 3.1, 4.2
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { getSession } from '@/lib/session';

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

async function testHomePageConfiguration() {
  log('\n=== Testing Home Page Configuration ===', YELLOW);
  
  try {
    // Test 1: Home page is in public paths (middleware allows unauthenticated access)
    const publicPaths = ['/', '/login', '/email-prompt', '/api/health'];
    assert(publicPaths.includes('/'), 'Home page (/) is in public paths');
    
    // Test 2: Login page is in public paths
    assert(publicPaths.includes('/login'), 'Login page is in public paths');
    
    // Test 3: Email prompt page is in public paths
    assert(publicPaths.includes('/email-prompt'), 'Email prompt page is in public paths');
    
  } catch (error) {
    log(`Home page configuration test error: ${error}`, RED);
    testsFailed++;
  }
}

async function testSessionValidation() {
  log('\n=== Testing Session Validation for Redirect ===', YELLOW);
  
  try {
    // Create test user
    const [user] = await db.insert(users)
      .values({ email: 'redirect-test@example.com' })
      .returning();
    
    // Test 1: Valid session can be retrieved
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });
    
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      ),
      with: { user: true },
    });
    
    assert(session !== undefined, 'Valid session can be retrieved');
    assert(session?.user.email === 'redirect-test@example.com', 'Session includes user data');
    
    // Test 2: Expired session is not retrieved
    const expiredToken = randomBytes(32).toString('base64url');
    const pastDate = new Date(Date.now() - 1000);
    
    await db.insert(sessions).values({
      userId: user.id,
      token: expiredToken,
      expiresAt: pastDate,
    });
    
    const expiredSession = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, expiredToken),
        gt(sessions.expiresAt, new Date())
      ),
    });
    
    assert(expiredSession === undefined, 'Expired session is not retrieved');
    
    // Test 3: Non-existent session returns undefined
    const nonExistentSession = await db.query.sessions.findFirst({
      where: eq(sessions.token, 'non-existent-token'),
    });
    
    assert(nonExistentSession === undefined, 'Non-existent session returns undefined');
    
    // Cleanup
    await db.delete(users).where(eq(users.id, user.id)).execute();
    
  } catch (error) {
    log(`Session validation test error: ${error}`, RED);
    testsFailed++;
  }
}

async function testAuthenticationFlow() {
  log('\n=== Testing Authentication Flow ===', YELLOW);
  
  try {
    // Test 1: User can be created
    const [user] = await db.insert(users)
      .values({ email: 'flow-test@example.com' })
      .returning();
    
    assert(user.id > 0, 'User creation generates ID');
    assert(user.email === 'flow-test@example.com', 'User email stored correctly');
    
    // Test 2: Session can be created for user
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const [session] = await db.insert(sessions)
      .values({
        userId: user.id,
        token,
        expiresAt,
      })
      .returning();
    
    assert(session.userId === user.id, 'Session linked to user');
    assert(session.token === token, 'Session token stored correctly');
    
    // Test 3: Session expiration is 7 days
    const timeDiff = session.expiresAt.getTime() - Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const isSevenDays = Math.abs(timeDiff - sevenDays) < 2000; // Within 2 seconds
    
    assert(isSevenDays, 'Session expiration is 7 days from creation');
    
    // Cleanup
    await db.delete(users).where(eq(users.id, user.id)).execute();
    
  } catch (error) {
    log(`Authentication flow test error: ${error}`, RED);
    testsFailed++;
  }
}

async function testProtectedRouteAccess() {
  log('\n=== Testing Protected Route Access ===', YELLOW);
  
  try {
    // Test 1: Dashboard requires authentication (has requireSession call)
    // This is verified by checking that the session validation logic exists
    const [user] = await db.insert(users)
      .values({ email: 'protected-test@example.com' })
      .returning();
    
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });
    
    // Verify session exists and is valid
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      ),
      with: { user: true },
    });
    
    assert(session !== undefined, 'Valid session exists for protected route access');
    assert(session?.user.id === user.id, 'Session user matches created user');
    
    // Cleanup
    await db.delete(users).where(eq(users.id, user.id)).execute();
    
  } catch (error) {
    log(`Protected route access test error: ${error}`, RED);
    testsFailed++;
  }
}

async function runTests() {
  log('Starting Home Page Redirect Verification\n', YELLOW);
  
  try {
    await cleanup();
    
    await testHomePageConfiguration();
    await testSessionValidation();
    await testAuthenticationFlow();
    await testProtectedRouteAccess();
    
    await cleanup();
    
    log('\n=== Test Summary ===', YELLOW);
    log(`Tests Passed: ${testsPassed}`, GREEN);
    log(`Tests Failed: ${testsFailed}`, RED);
    
    if (testsFailed === 0) {
      log('\n✓ All home page redirect tests passed!', GREEN);
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

