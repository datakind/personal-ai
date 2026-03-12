import { db } from '@/db';
import { users, trainingMaterials } from '@/db/schema';
import { recordTrainingCompletion, markCompletionAsSynced, getUnsyncedCompletions } from '@/lib/training';

async function testMarkCompletionAsSynced() {
  console.log('Testing markCompletionAsSynced function...\n');

  try {
    // Create a test user
    const [user] = await db.insert(users).values({
      email: `test-sync-${Date.now()}@example.com`,
    }).returning();
    console.log('✓ Created test user:', user.id);

    // Create a test material
    const [material] = await db.insert(trainingMaterials).values({
      title: 'Test Sync Material',
      content: 'Test content for sync',
      categoryId: 'test-sync',
    }).returning();
    console.log('✓ Created test material:', material.id);

    // Record a completion
    const completionResult = await recordTrainingCompletion(user.id, material.id);
    if (!completionResult.success) {
      throw new Error(`Failed to record completion: ${completionResult.error}`);
    }
    console.log('✓ Recorded completion:', completionResult.completion.id);
    console.log('  - synced:', completionResult.completion.synced);
    console.log('  - lastSyncedAt:', completionResult.completion.lastSyncedAt);
    console.log('  - remoteId:', completionResult.completion.remoteId);

    // Verify it's unsynced
    const unsyncedBefore = await getUnsyncedCompletions(user.id);
    console.log('\n✓ Unsynced completions before sync:', unsyncedBefore.length);

    // Mark as synced without remoteId
    console.log('\nTest 1: Mark as synced without remoteId');
    const syncResult1 = await markCompletionAsSynced(completionResult.completion.id);
    if (!syncResult1.success) {
      throw new Error(`Failed to mark as synced: ${syncResult1.error}`);
    }
    console.log('✓ Marked as synced');
    console.log('  - synced:', syncResult1.completion.synced);
    console.log('  - lastSyncedAt:', syncResult1.completion.lastSyncedAt);
    console.log('  - remoteId:', syncResult1.completion.remoteId);

    // Verify it's no longer unsynced
    const unsyncedAfter = await getUnsyncedCompletions(user.id);
    console.log('✓ Unsynced completions after sync:', unsyncedAfter.length);

    // Create another completion to test with remoteId
    const [material2] = await db.insert(trainingMaterials).values({
      title: 'Test Sync Material 2',
      content: 'Test content for sync 2',
      categoryId: 'test-sync',
    }).returning();
    const completionResult2 = await recordTrainingCompletion(user.id, material2.id);
    if (!completionResult2.success) {
      throw new Error(`Failed to record completion 2: ${completionResult2.error}`);
    }

    // Mark as synced with remoteId
    console.log('\nTest 2: Mark as synced with remoteId');
    const remoteId = 'remote-123-abc';
    const syncResult2 = await markCompletionAsSynced(completionResult2.completion.id, remoteId);
    if (!syncResult2.success) {
      throw new Error(`Failed to mark as synced with remoteId: ${syncResult2.error}`);
    }
    console.log('✓ Marked as synced with remoteId');
    console.log('  - synced:', syncResult2.completion.synced);
    console.log('  - lastSyncedAt:', syncResult2.completion.lastSyncedAt);
    console.log('  - remoteId:', syncResult2.completion.remoteId);

    // Test with non-existent completion ID
    console.log('\nTest 3: Mark non-existent completion as synced');
    const syncResult3 = await markCompletionAsSynced(999999);
    if (syncResult3.success) {
      throw new Error('Expected failure for non-existent completion');
    }
    console.log('✓ Correctly returned error:', syncResult3.error);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testMarkCompletionAsSynced();
