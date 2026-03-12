/**
 * Token Lifecycle Verification Script
 * 
 * This script verifies that the complete OAuth token lifecycle works correctly:
 * 1. Tokens are stored after successful callback
 * 2. Expired tokens trigger automatic refresh
 * 3. Failed refresh deletes tokens
 */

import { db } from '@/db';
import { users, oauthTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  storeTokens,
  getTokensForUser,
  deleteTokensForUser,
  isTokenExpired,
  getValidAccessToken,
  refreshAccessToken,
} from '@/lib/oauth';

async function main() {
  console.log('🔍 Token Lifecycle Verification\n');

  // Create a test user
  console.log('1. Creating test user...');
  const [testUser] = await db.insert(users).values({
    name: 'Token Test User',
    email: `token-test-${Date.now()}@example.com`,
    createdAt: new Date(),
  }).returning();
  console.log(`✓ Created user with ID: ${testUser.id}\n`);

  try {
    // Test 1: Tokens are stored after successful callback
    console.log('2. Testing token storage...');
    await storeTokens(
      testUser.id,
      'test-access-token',
      'test-refresh-token',
      3600 // 1 hour
    );
    
    let tokens = await getTokensForUser(testUser.id);
    if (!tokens) {
      throw new Error('❌ FAILED: Tokens were not stored');
    }
    console.log('✓ Tokens stored successfully');
    console.log(`  - Access Token: ${tokens.accessToken.substring(0, 20)}...`);
    console.log(`  - Refresh Token: ${tokens.refreshToken?.substring(0, 20)}...`);
    console.log(`  - Expires At: ${tokens.expiresAt.toISOString()}`);
    console.log(`  - Is Expired: ${isTokenExpired(tokens.expiresAt)}\n`);

    // Test 2: Valid tokens are returned without refresh
    console.log('3. Testing valid token retrieval...');
    const validToken = await getValidAccessToken(testUser.id);
    if (!validToken) {
      throw new Error('❌ FAILED: Could not retrieve valid token');
    }
    if (validToken !== 'test-access-token') {
      throw new Error('❌ FAILED: Retrieved token does not match stored token');
    }
    console.log('✓ Valid token retrieved without refresh\n');

    // Test 3: Expired tokens trigger automatic refresh
    console.log('4. Testing expired token refresh...');
    
    // Store an expired token
    await storeTokens(
      testUser.id,
      'expired-access-token',
      'test-refresh-token',
      -3600 // Expired 1 hour ago
    );
    
    tokens = await getTokensForUser(testUser.id);
    if (!tokens || !isTokenExpired(tokens.expiresAt)) {
      throw new Error('❌ FAILED: Token should be expired');
    }
    console.log('✓ Stored expired token');
    console.log(`  - Is Expired: ${isTokenExpired(tokens.expiresAt)}`);
    
    // Note: We can't actually test refresh without a real OAuth server
    // But we can verify the logic by checking if getValidAccessToken
    // would attempt refresh (it will fail and delete tokens)
    console.log('  - Attempting to get valid token (will fail without real OAuth server)...');
    const refreshedToken = await getValidAccessToken(testUser.id);
    
    if (refreshedToken !== null) {
      throw new Error('❌ FAILED: Should return null when refresh fails');
    }
    console.log('✓ Refresh failed as expected (no real OAuth server)\n');

    // Test 4: Failed refresh deletes tokens
    console.log('5. Testing token deletion after failed refresh...');
    tokens = await getTokensForUser(testUser.id);
    if (tokens !== null) {
      throw new Error('❌ FAILED: Tokens should be deleted after failed refresh');
    }
    console.log('✓ Tokens deleted after failed refresh\n');

    // Test 5: Manual token deletion works
    console.log('6. Testing manual token deletion...');
    await storeTokens(
      testUser.id,
      'another-access-token',
      'another-refresh-token',
      3600
    );
    
    tokens = await getTokensForUser(testUser.id);
    if (!tokens) {
      throw new Error('❌ FAILED: Tokens were not stored');
    }
    console.log('✓ Tokens stored');
    
    await deleteTokensForUser(testUser.id);
    tokens = await getTokensForUser(testUser.id);
    if (tokens !== null) {
      throw new Error('❌ FAILED: Tokens were not deleted');
    }
    console.log('✓ Tokens deleted successfully\n');

    console.log('✅ All token lifecycle tests passed!\n');
    console.log('Summary:');
    console.log('  ✓ Tokens are stored after successful callback');
    console.log('  ✓ Valid tokens are returned without refresh');
    console.log('  ✓ Expired tokens trigger automatic refresh attempt');
    console.log('  ✓ Failed refresh deletes tokens');
    console.log('  ✓ Manual token deletion works');

  } finally {
    // Cleanup
    console.log('\n7. Cleaning up...');
    await db.delete(oauthTokens).where(eq(oauthTokens.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log('✓ Cleanup complete');
  }
}

main().catch((error) => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
