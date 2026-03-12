/**
 * Test Environment Setup Script
 * 
 * This script helps set up the test environment for manual testing of Task 12.1.
 * It creates test users with different qualification statuses and provides
 * instructions for testing the complete user flows.
 * 
 * Usage: npx tsx scripts/setup-test-environment.ts
 */

import { db } from '@/db';
import { users, oauthTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment for Task 12.1...\n');

  try {
    // Check if test users already exist
    const existingUsers = await db.query.users.findMany();
    
    console.log(`📊 Current users in database: ${existingUsers.length}`);
    
    if (existingUsers.length === 0) {
      console.log('⚠️  No users found. Creating test users...\n');
      
      // Create test users
      const testUsers = [
        {
          name: 'Test User (Not Qualified)',
          email: 'test.user@example.com',
          createdAt: new Date(),
        },
        {
          name: 'Test User (PHQ-9 Qualified)',
          email: 'qualified.user@example.com',
          createdAt: new Date(),
        },
      ];

      for (const userData of testUsers) {
        const [user] = await db.insert(users).values(userData).returning();
        console.log(`✅ Created user: ${user.name} (ID: ${user.id})`);
      }
    } else {
      console.log('\n📋 Existing users:');
      existingUsers.forEach(user => {
        console.log(`   - ${user.name} (ID: ${user.id}, Email: ${user.email})`);
      });
    }

    // Find a user to set up as qualified
    const allUsers = await db.query.users.findMany();
    
    if (allUsers.length > 0) {
      console.log('\n🔐 Setting up OAuth token for qualified user testing...');
      
      // Use the first user or find one named "qualified"
      const qualifiedUser = allUsers.find(u => u.email.includes('qualified')) || allUsers[0];
      
      // Check if OAuth token already exists
      const existingToken = await db.query.oauthTokens.findFirst({
        where: eq(oauthTokens.userId, qualifiedUser.id),
      });

      if (existingToken) {
        console.log(`ℹ️  OAuth token already exists for user: ${qualifiedUser.name}`);
        console.log(`   Token expires at: ${existingToken.expiresAt}`);
        
        // Update expiration to be in the future
        await db.update(oauthTokens)
          .set({
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            updatedAt: new Date(),
          })
          .where(eq(oauthTokens.userId, qualifiedUser.id));
        
        console.log(`✅ Updated token expiration to 24 hours from now`);
      } else {
        // Create OAuth token for testing
        const tokenData = {
          userId: qualifiedUser.id,
          accessToken: 'test_access_token_' + Math.random().toString(36).substring(7),
          refreshToken: 'test_refresh_token_' + Math.random().toString(36).substring(7),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(oauthTokens).values(tokenData);
        console.log(`✅ Created OAuth token for user: ${qualifiedUser.name} (ID: ${qualifiedUser.id})`);
      }

      console.log('\n📝 Test Environment Summary:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const usersWithTokens = await db.query.users.findMany({
        with: {
          oauthToken: true,
        },
      });

      usersWithTokens.forEach(user => {
        const hasToken = !!user.oauthToken;
        const status = hasToken ? '✅ Has OAuth Token (Qualified)' : '❌ No OAuth Token (Not Qualified)';
        console.log(`\n👤 ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Status: ${status}`);
      });

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📖 Next Steps:');
      console.log('   1. Start the development server: npm run dev');
      console.log('   2. Navigate to: http://localhost:3000/login');
      console.log('   3. Log in with any user email from above');
      console.log('   4. Follow the test plan: scripts/MANUAL-TEST-PLAN.md');
      console.log('\n⚠️  Important Notes:');
      console.log('   - Users with OAuth tokens will be treated as "qualified" for PHQ-9');
      console.log('   - The external API must be mocked or available for qualification checks');
      console.log('   - Set EXTERNAL_API_URL environment variable if using a mock API');
      console.log('   - Without a mock API, the system will default to "not qualified"');
      console.log('\n✨ Test environment setup complete!\n');
    }

  } catch (error) {
    console.error('❌ Error setting up test environment:', error);
    process.exit(1);
  }
}

// Run the setup
setupTestEnvironment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
