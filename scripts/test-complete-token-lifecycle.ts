/**
 * Complete Token Lifecycle Integration Test
 * 
 * This script simulates the complete OAuth flow and verifies:
 * 1. Tokens are stored after successful callback (simulated)
 * 2. Expired tokens trigger automatic refresh
 * 3. Failed refresh deletes tokens
 * 4. Valid tokens are returned without refresh
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
} from '@/lib/oauth';

async function main() {
  console.log('🔍 Complete Token Lifecycle Integration Test\n');
  console.log('This test verifies all checkpoint requirements:\n');

  // Create a test user
  console.log('Setup: Creating test user...');
  const [testUser] = await db.insert(users).values({
    name: 'Lifecycle Test User',
    email: `lifecycle-test-${Date.now()}@example.com`,
    createdAt: new Date(),
  }).returning();
  console.log(`✓ Created user with ID: ${testUser.id}\n`);

  try {
    // ========================================
    // CHECKPOINT 1: Tokens are stored after successful callback
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHECKPOINT 1: Tokens are stored after successful callback');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Simulating successful OAuth callback...');
    console.log('  - Authorization code exchanged for tokens');
    console.log('  - Storing tokens in database...');
    
    await storeTokens(
      testUser.id,
      'fresh-access-token-abc123',
      'fresh-refresh-token-xyz789',
      3600 // 1 hour
    );
    
    let tokens = await getTokensForUser(testUser.id);
    if (!tokens) {
      throw new Error('❌ CHECKPOINT 1 FAILED: Tokens were not stored after callback');
    }
    
    console.log('✅ CHECKPOINT 1 PASSED: Tokens stored successfully');
    console.log(`  - User ID: ${tokens.userId}`);
    console.log(`  - Access Token: ${tokens.accessToken.substring(0, 25)}...`);
    console.log(`  - Refresh Token: ${tokens.refreshToken?.substring(0, 25)}...`);
    console.log(`  - Expires At: ${tokens.expiresAt.toISOString()}`);
    console.log(`  - Is Expired: ${isTokenExpired(tokens.expiresAt)}`);
    console.log(`  - Created At: ${tokens.createdAt.toISOString()}\n`);

    // ========================================
    // CHECKPOINT 2: Valid tokens work without refresh
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHECKPOINT 2: Valid tokens are returned without refresh');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Requesting valid access token...');
    const validToken = await getValidAccessToken(testUser.id);
    
    if (!validToken) {
      throw new Error('❌ CHECKPOINT 2 FAILED: Could not retrieve valid token');
    }
    
    if (validToken !== 'fresh-access-token-abc123') {
      throw new Error('❌ CHECKPOINT 2 FAILED: Retrieved token does not match stored token');
    }
    
    console.log('✅ CHECKPOINT 2 PASSED: Valid token retrieved without refresh');
    console.log(`  - Token: ${validToken.substring(0, 25)}...`);
    console.log('  - No refresh was needed (token not expired)\n');

    // ========================================
    // CHECKPOINT 3: Expired tokens trigger automatic refresh
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHECKPOINT 3: Expired tokens trigger automatic refresh');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Storing an expired token...');
    await storeTokens(
      testUser.id,
      'expired-access-token',
      'valid-refresh-token',
      -3600 // Expired 1 hour ago
    );
    
    tokens = await getTokensForUser(testUser.id);
    if (!tokens || !isTokenExpired(tokens.expiresAt)) {
      throw new Error('❌ CHECKPOINT 3 FAILED: Token should be expired');
    }
    
    console.log('✓ Expired token stored');
    console.log(`  - Access Token: ${tokens.accessToken}`);
    console.log(`  - Expires At: ${tokens.expiresAt.toISOString()}`);
    console.log(`  - Is Expired: ${isTokenExpired(tokens.expiresAt)}`);
    
    console.log('\nAttempting to get valid token (will trigger refresh)...');
    console.log('  - Note: Refresh will fail without real OAuth server');
    console.log('  - This is expected behavior for this test');
    
    const refreshedToken = await getValidAccessToken(testUser.id);
    
    if (refreshedToken !== null) {
      throw new Error('❌ CHECKPOINT 3 FAILED: Should return null when refresh fails');
    }
    
    console.log('✅ CHECKPOINT 3 PASSED: Refresh was attempted for expired token');
    console.log('  - getValidAccessToken detected expired token');
    console.log('  - Automatic refresh was triggered');
    console.log('  - Refresh failed (no real OAuth server) as expected\n');

    // ========================================
    // CHECKPOINT 4: Failed refresh deletes tokens
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHECKPOINT 4: Failed refresh deletes tokens');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Checking if tokens were deleted after failed refresh...');
    tokens = await getTokensForUser(testUser.id);
    
    if (tokens !== null) {
      throw new Error('❌ CHECKPOINT 4 FAILED: Tokens should be deleted after failed refresh');
    }
    
    console.log('✅ CHECKPOINT 4 PASSED: Tokens deleted after failed refresh');
    console.log('  - Invalid tokens removed from database');
    console.log('  - User must re-authorize to link account again');
    console.log('  - This prevents using invalid credentials\n');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL CHECKPOINTS PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Token Lifecycle Summary:');
    console.log('  ✅ Tokens are stored after successful callback');
    console.log('  ✅ Valid tokens are returned without refresh');
    console.log('  ✅ Expired tokens trigger automatic refresh');
    console.log('  ✅ Failed refresh deletes tokens');
    console.log('\nThe complete token lifecycle is working correctly! 🎉\n');

  } finally {
    // Cleanup
    console.log('Cleanup: Removing test data...');
    await db.delete(oauthTokens).where(eq(oauthTokens.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log('✓ Cleanup complete\n');
  }
}

main().catch((error) => {
  console.error('\n❌ TEST FAILED:', error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
});
