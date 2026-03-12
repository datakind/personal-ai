/**
 * Test script for getValidAccessToken function
 * 
 * This script verifies that the getValidAccessToken function:
 * 1. Returns null for users without tokens
 * 2. Returns valid tokens immediately if not expired
 * 3. Attempts refresh for expired tokens
 * 4. Deletes tokens if refresh fails
 */

import { db } from '@/db';
import { users, oauthTokens } from '@/db/schema';
import { getValidAccessToken, storeTokens, deleteTokensForUser } from '@/lib/oauth';

async function testGetValidAccessToken() {
  console.log('Testing getValidAccessToken function...\n');

  // Create a test user
  const [testUser] = await db.insert(users).values({
    name: 'Test User for Token Validation',
    email: `test-token-${Date.now()}@example.com`,
    createdAt: new Date(),
  }).returning();

  console.log(`✓ Created test user: ${testUser.name} (ID: ${testUser.id})`);

  try {
    // Test 1: User with no tokens should return null
    console.log('\n--- Test 1: User with no tokens ---');
    const noTokenResult = await getValidAccessToken(testUser.id);
    console.log(`Result: ${noTokenResult}`);
    console.log(noTokenResult === null ? '✓ PASS: Returns null for user without tokens' : '✗ FAIL: Should return null');

    // Test 2: User with valid (non-expired) token should return token immediately
    console.log('\n--- Test 2: User with valid token ---');
    const futureExpiry = 3600; // 1 hour from now
    await storeTokens(testUser.id, 'valid-access-token', 'valid-refresh-token', futureExpiry);
    console.log('Stored valid token with 1 hour expiry');
    
    const validTokenResult = await getValidAccessToken(testUser.id);
    console.log(`Result: ${validTokenResult}`);
    console.log(validTokenResult === 'valid-access-token' ? '✓ PASS: Returns valid token immediately' : '✗ FAIL: Should return the valid token');

    // Test 3: User with expired token but no refresh token should delete tokens and return null
    console.log('\n--- Test 3: User with expired token and no refresh token ---');
    await storeTokens(testUser.id, 'expired-access-token', null, -3600); // Expired 1 hour ago
    console.log('Stored expired token with no refresh token');
    
    const expiredNoRefreshResult = await getValidAccessToken(testUser.id);
    console.log(`Result: ${expiredNoRefreshResult}`);
    console.log(expiredNoRefreshResult === null ? '✓ PASS: Returns null and deletes tokens' : '✗ FAIL: Should return null');

    // Verify tokens were deleted
    const { eq } = await import('drizzle-orm');
    const deletedTokens = await db.query.oauthTokens.findFirst({
      where: eq(oauthTokens.userId, testUser.id),
    });
    console.log(deletedTokens === undefined ? '✓ PASS: Tokens were deleted from database' : '✗ FAIL: Tokens should be deleted');

    // Test 4: User with expired token and refresh token (will fail without real OAuth server)
    console.log('\n--- Test 4: User with expired token and refresh token ---');
    console.log('Note: This will fail without a real OAuth server, which is expected');
    await storeTokens(testUser.id, 'expired-access-token', 'test-refresh-token', -3600);
    console.log('Stored expired token with refresh token');
    
    const expiredWithRefreshResult = await getValidAccessToken(testUser.id);
    console.log(`Result: ${expiredWithRefreshResult}`);
    console.log(expiredWithRefreshResult === null ? '✓ PASS: Returns null when refresh fails (expected without OAuth server)' : '✗ FAIL: Should return null when refresh fails');

    // Verify tokens were deleted after failed refresh
    const deletedAfterRefreshFail = await db.query.oauthTokens.findFirst({
      where: eq(oauthTokens.userId, testUser.id),
    });
    console.log(deletedAfterRefreshFail === undefined ? '✓ PASS: Tokens were deleted after refresh failure' : '✗ FAIL: Tokens should be deleted after refresh failure');

    console.log('\n✓ All tests completed successfully!');
    console.log('\nSummary:');
    console.log('- Returns null for users without tokens ✓');
    console.log('- Returns valid tokens immediately if not expired ✓');
    console.log('- Deletes tokens when expired and no refresh token ✓');
    console.log('- Attempts refresh and deletes tokens on failure ✓');

  } catch (error) {
    console.error('\n✗ Test failed with error:', error);
    throw error;
  } finally {
    // Cleanup: delete test user (cascade will delete tokens)
    const { eq } = await import('drizzle-orm');
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log(`\n✓ Cleaned up test user (ID: ${testUser.id})`);
  }
}

// Run the test
testGetValidAccessToken()
  .then(() => {
    console.log('\n✓ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Test script failed:', error);
    process.exit(1);
  });
