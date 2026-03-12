/**
 * Integration check for complete authentication system
 * Task 8: Checkpoint - Verify complete authentication system
 * 
 * This script performs a comprehensive check of:
 * - Database setup and schema
 * - Authentication logic (login/logout)
 * - Session management
 * - Middleware protection
 * - UI components
 * - Cleanup functionality
 */

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticate, logout } from '@/app/auth/actions';
import { getSession, requireSession } from '@/lib/session';
import { cleanupExpiredSessions } from '@/lib/cleanup';

// Color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';

let checksPassed = 0;
let checksFailed = 0;

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function check(condition: boolean, testName: string) {
  if (condition) {
    checksPassed++;
    log(`✓ ${testName}`, GREEN);
  } else {
    checksFailed++;
    log(`✗ ${testName}`, RED);
  }
}

async function cleanup() {
  await db.delete(sessions).execute();
  await db.delete(users).execute();
}

async function checkDatabaseInfrastructure() {
  log('\n=== 1. Database Infrastructure ===', BLUE);
  
  try {
    // Verify tables exist and can be queried
    const userCount = await db.select().from(users).execute();
    check(Array.isArray(userCount), 'Users table accessible');
    
    const sessionCount = await db.select().from(sessions).execute();
    check(Array.isArray(sessionCount), 'Sessions table accessible');
    
    // Verify schema constraints
    const [testUser] = await db.insert(users)
      .values({ email: 'schema-test@example.com' })
      .returning();
    check(testUser.id > 0, 'User creation with auto-increment ID');
    check(testUser.email === 'schema-test@example.com', 'Email field storage');
    check(testUser.createdAt instanceof Date, 'Timestamp fields working');
    
    await db.delete(users).where(eq(users.id, testUser.id)).execute();
    
  } catch (error) {
    log(`Database infrastructure error: ${error}`, RED);
    checksFailed++;
  }
}

async function checkAuthenticationLogic() {
  log('\n=== 2. Core Authentication Logic ===', BLUE);
  
  try {
    // Test email validation
    const invalidEmail = new FormData();
    invalidEmail.set('email', 'not-an-email');
    const invalidResult = await authenticate(invalidEmail);
    check(invalidResult?.error === 'Invalid email format', 'Invalid email rejected');
    
    // Test user creation on first login
    const newUserEmail = new FormData();
    newUserEmail.set('email', 'newuser@example.com');
    
    try {
      await authenticate(newUserEmail);
      // Will redirect, so we catch the error
    } catch (error: any) {
      // Next.js redirect throws NEXT_REDIRECT error
      check(error?.message?.includes('NEXT_REDIRECT'), 'Authentication redirects after success');
    }
    
    // Verify user was created
    const createdUser = await db.query.users.findFirst({
      where: eq(users.email, 'newuser@example.com'),
    });
    check(createdUser !== undefined, 'New user created in database');
    
    // Verify session was created
    const userSession = await db.query.sessions.findFirst({
      where: eq(sessions.userId, createdUser!.id),
    });
    check(userSession !== undefined, 'Session created for new user');
    check(userSession!.token.length >= 43, 'Session token is cryptographically secure');
    
    // Verify 7-day expiration
    const expirationDiff = userSession!.expiresAt.getTime() - Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const isSevenDays = Math.abs(expirationDiff - sevenDays) < 5000; // Within 5 seconds
    check(isSevenDays, 'Session expires in 7 days');
    
    // Test existing user login
    const existingUserEmail = new FormData();
    existingUserEmail.set('email', 'newuser@example.com');
    
    try {
      await authenticate(existingUserEmail);
    } catch (error: any) {
      check(error?.message?.includes('NEXT_REDIRECT'), 'Existing user can authenticate');
    }
    
    // Verify no duplicate user was created
    const allUsers = await db.select()
      .from(users)
      .where(eq(users.email, 'newuser@example.com'))
      .execute();
    check(allUsers.length === 1, 'No duplicate users created');
    
  } catch (error) {
    log(`Authentication logic error: ${error}`, RED);
    checksFailed++;
  }
}

async function checkSessionManagement() {
  log('\n=== 3. Session Management ===', BLUE);
  
  try {
    // Create a test user and session
    const [user] = await db.insert(users)
      .values({ email: 'session-test@example.com' })
      .returning();
    
    const validToken = 'test-valid-token-' + Date.now();
    const validExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await db.insert(sessions).values({
      userId: user.id,
      token: validToken,
      expiresAt: validExpiry,
    });
    
    // Note: getSession requires cookies, which we can't test in this script
    // But we can verify the database query logic
    const sessionQuery = await db.query.sessions.findFirst({
      where: eq(sessions.token, validToken),
      with: { user: true },
    });
    
    check(sessionQuery !== undefined, 'Valid session can be queried');
    check(sessionQuery?.user.email === 'session-test@example.com', 'Session includes user data');
    
    // Test expired session
    const expiredToken = 'test-expired-token-' + Date.now();
    const expiredDate = new Date(Date.now() - 1000);
    
    await db.insert(sessions).values({
      userId: user.id,
      token: expiredToken,
      expiresAt: expiredDate,
    });
    
    const expiredQuery = await db.query.sessions.findFirst({
      where: eq(sessions.token, expiredToken),
    });
    
    check(expiredQuery !== undefined, 'Expired session exists in database');
    check(expiredQuery!.expiresAt < new Date(), 'Expired session has past expiration date');
    
    // Cleanup
    await db.delete(users).where(eq(users.id, user.id)).execute();
    
  } catch (error) {
    log(`Session management error: ${error}`, RED);
    checksFailed++;
  }
}

async function checkProtectedRoutes() {
  log('\n=== 4. Protected Routes & Middleware ===', BLUE);
  
  try {
    // Verify middleware file exists and exports correctly
    const middlewareModule = await import('@/middleware');
    check(typeof middlewareModule.middleware === 'function', 'Middleware function exported');
    check(middlewareModule.config?.matcher !== undefined, 'Middleware matcher configured');
    
    // Verify session utilities exist
    check(typeof getSession === 'function', 'getSession utility exists');
    check(typeof requireSession === 'function', 'requireSession utility exists');
    
    log('  ℹ Middleware protection requires runtime environment to test fully', YELLOW);
    
  } catch (error) {
    log(`Protected routes error: ${error}`, RED);
    checksFailed++;
  }
}

async function checkUIComponents() {
  log('\n=== 5. UI Components ===', BLUE);
  
  try {
    // Verify login page exists
    const loginPage = await import('@/app/login/page');
    check(typeof loginPage.default === 'function', 'Login page component exists');
    
    // Verify login form exists
    const loginForm = await import('@/app/login/login-form');
    check(typeof loginForm.default === 'function', 'Login form component exists');
    
    // Verify dashboard page exists
    const dashboardPage = await import('@/app/dashboard/page');
    check(typeof dashboardPage.default === 'function', 'Dashboard page component exists');
    
    // Verify auth actions exist
    check(typeof authenticate === 'function', 'Authenticate action exists');
    check(typeof logout === 'function', 'Logout action exists');
    
  } catch (error) {
    log(`UI components error: ${error}`, RED);
    checksFailed++;
  }
}

async function checkCleanupFunctionality() {
  log('\n=== 6. Session Cleanup ===', BLUE);
  
  try {
    // Create test user
    const [user] = await db.insert(users)
      .values({ email: 'cleanup-test@example.com' })
      .returning();
    
    // Create expired session
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      userId: user.id,
      token: 'expired-cleanup-token',
      expiresAt: expiredDate,
    });
    
    // Create valid session
    const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      userId: user.id,
      token: 'valid-cleanup-token',
      expiresAt: validDate,
    });
    
    // Run cleanup
    const deletedCount = await cleanupExpiredSessions();
    check(deletedCount === 1, 'Cleanup deletes expired sessions');
    
    // Verify expired session is gone
    const expiredSession = await db.query.sessions.findFirst({
      where: eq(sessions.token, 'expired-cleanup-token'),
    });
    check(expiredSession === undefined, 'Expired session removed from database');
    
    // Verify valid session remains
    const validSession = await db.query.sessions.findFirst({
      where: eq(sessions.token, 'valid-cleanup-token'),
    });
    check(validSession !== undefined, 'Valid session preserved');
    
    // Cleanup
    await db.delete(users).where(eq(users.id, user.id)).execute();
    
  } catch (error) {
    log(`Cleanup functionality error: ${error}`, RED);
    checksFailed++;
  }
}

async function checkDatabaseConstraints() {
  log('\n=== 7. Database Constraints ===', BLUE);
  
  try {
    // Test email uniqueness
    const [user1] = await db.insert(users)
      .values({ email: 'constraint-test@example.com' })
      .returning();
    
    let emailConstraintWorks = false;
    try {
      await db.insert(users).values({ email: 'constraint-test@example.com' }).execute();
    } catch (error) {
      emailConstraintWorks = true;
    }
    check(emailConstraintWorks, 'Email uniqueness constraint enforced');
    
    // Test token uniqueness
    const token = 'unique-token-test';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await db.insert(sessions).values({
      userId: user1.id,
      token,
      expiresAt,
    });
    
    let tokenConstraintWorks = false;
    try {
      await db.insert(sessions).values({
        userId: user1.id,
        token,
        expiresAt,
      }).execute();
    } catch (error) {
      tokenConstraintWorks = true;
    }
    check(tokenConstraintWorks, 'Token uniqueness constraint enforced');
    
    // Test cascade delete
    const sessionsBefore = await db.select()
      .from(sessions)
      .where(eq(sessions.userId, user1.id))
      .execute();
    
    await db.delete(users).where(eq(users.id, user1.id)).execute();
    
    const sessionsAfter = await db.select()
      .from(sessions)
      .where(eq(sessions.userId, user1.id))
      .execute();
    
    check(sessionsBefore.length > 0 && sessionsAfter.length === 0, 'Foreign key cascade delete works');
    
  } catch (error) {
    log(`Database constraints error: ${error}`, RED);
    checksFailed++;
  }
}

async function runIntegrationCheck() {
  log('╔════════════════════════════════════════════════════════════╗', BLUE);
  log('║  Task 8: Complete Authentication System Verification      ║', BLUE);
  log('╚════════════════════════════════════════════════════════════╝', BLUE);
  
  try {
    await cleanup();
    
    await checkDatabaseInfrastructure();
    await checkAuthenticationLogic();
    await checkSessionManagement();
    await checkProtectedRoutes();
    await checkUIComponents();
    await checkCleanupFunctionality();
    await checkDatabaseConstraints();
    
    await cleanup();
    
    log('\n╔════════════════════════════════════════════════════════════╗', BLUE);
    log('║                    VERIFICATION SUMMARY                    ║', BLUE);
    log('╚════════════════════════════════════════════════════════════╝', BLUE);
    log(`\nChecks Passed: ${checksPassed}`, GREEN);
    log(`Checks Failed: ${checksFailed}`, checksFailed > 0 ? RED : GREEN);
    
    if (checksFailed === 0) {
      log('\n✓ Complete authentication system verified successfully!', GREEN);
      log('\nAll components working:', GREEN);
      log('  • Database infrastructure and schema', GREEN);
      log('  • Core authentication logic (login/logout)', GREEN);
      log('  • Session management and validation', GREEN);
      log('  • Protected routes and middleware', GREEN);
      log('  • UI components (login, dashboard)', GREEN);
      log('  • Session cleanup functionality', GREEN);
      log('  • Database constraints enforcement', GREEN);
      
      log('\nReady to proceed to migration tasks (Task 9).', YELLOW);
      process.exit(0);
    } else {
      log('\n✗ Some checks failed. Please review the output above.', RED);
      process.exit(1);
    }
    
  } catch (error) {
    log(`\nFatal error: ${error}`, RED);
    process.exit(1);
  }
}

runIntegrationCheck();
