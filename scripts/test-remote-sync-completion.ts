import { db } from '@/db';
import { users, trainingMaterials } from '@/db/schema';
import { 
  createCompletionFromRemoteSync,
  recordTrainingCompletion,
  getUserCompletionHistory 
} from '@/lib/training';

async function testRemoteSyncCompletion() {
  console.log('Testing createCompletionFromRemoteSync function...\n');

  // Create test user
  const [testUser] = await db
    .insert(users)
    .values({ email: 'remote-sync-test@example.com' })
    .returning();
  console.log(`✓ Created test user: ${testUser.email} (ID: ${testUser.id})`);

  // Create test material
  const [testMaterial] = await db
    .insert(trainingMaterials)
    .values({
      title: 'Remote Sync Test Material',
      content: 'Test content for remote sync',
      categoryId: 'remote-sync-test',
    })
    .returning();
  console.log(`✓ Created test material: ${testMaterial.title} (ID: ${testMaterial.id})\n`);

  // Test 1: Create completion from remote sync (new completion)
  console.log('Test 1: Create new completion from remote sync');
  const result1 = await createCompletionFromRemoteSync(
    testUser.id,
    testMaterial.id,
    'remote-123',
    new Date('2024-01-15T10:00:00Z')
  );

  if (result1.success) {
    console.log('✓ Successfully created completion from remote sync');
    console.log(`  - Synced: ${result1.completion.synced}`);
    console.log(`  - Remote ID: ${result1.completion.remoteId}`);
    console.log(`  - Last Synced At: ${result1.completion.lastSyncedAt}`);
    console.log(`  - Completed At: ${result1.completion.completedAt}\n`);
  } else {
    console.error('✗ Failed to create completion:', result1.error);
    return;
  }

  // Test 2: Try to create duplicate (should update existing)
  console.log('Test 2: Create duplicate completion from remote sync (should update existing)');
  const result2 = await createCompletionFromRemoteSync(
    testUser.id,
    testMaterial.id,
    'remote-456',
    new Date('2024-01-16T10:00:00Z')
  );

  if (result2.success) {
    console.log('✓ Successfully handled duplicate - updated existing completion');
    console.log(`  - Synced: ${result2.completion.synced}`);
    console.log(`  - Remote ID: ${result2.completion.remoteId}`);
    console.log(`  - Last Synced At: ${result2.completion.lastSyncedAt}\n`);
  } else {
    console.error('✗ Failed to handle duplicate:', result2.error);
    return;
  }

  // Test 3: Create local completion first, then sync from remote
  const [testMaterial2] = await db
    .insert(trainingMaterials)
    .values({
      title: 'Local First Test Material',
      content: 'Test content for local-first scenario',
      categoryId: 'local-first-test',
    })
    .returning();
  console.log(`✓ Created second test material: ${testMaterial2.title} (ID: ${testMaterial2.id})`);

  console.log('\nTest 3: Create local completion first, then sync from remote');
  
  // Create local completion (unsynced)
  const localResult = await recordTrainingCompletion(testUser.id, testMaterial2.id);
  if (localResult.success) {
    console.log('✓ Created local completion (unsynced)');
    console.log(`  - Synced: ${localResult.completion.synced}`);
    console.log(`  - Remote ID: ${localResult.completion.remoteId}`);
  }

  // Now try to create from remote sync (should update existing local completion)
  const result3 = await createCompletionFromRemoteSync(
    testUser.id,
    testMaterial2.id,
    'remote-789'
  );

  if (result3.success) {
    console.log('✓ Successfully updated local completion with remote sync metadata');
    console.log(`  - Synced: ${result3.completion.synced}`);
    console.log(`  - Remote ID: ${result3.completion.remoteId}`);
    console.log(`  - Last Synced At: ${result3.completion.lastSyncedAt}\n`);
  } else {
    console.error('✗ Failed to update local completion:', result3.error);
    return;
  }

  // Test 4: Verify completion history
  console.log('Test 4: Verify user completion history');
  const history = await getUserCompletionHistory(testUser.id);
  console.log(`✓ User has ${history.length} completions`);
  history.forEach((completion, index) => {
    console.log(`  ${index + 1}. ${completion.material.title}`);
    console.log(`     - Synced: ${completion.synced}, Remote ID: ${completion.remoteId}`);
  });

  // Test 5: Test with invalid user ID
  console.log('\nTest 5: Test with invalid user ID');
  const result4 = await createCompletionFromRemoteSync(
    99999,
    testMaterial.id,
    'remote-invalid'
  );

  if (!result4.success) {
    console.log('✓ Correctly rejected invalid user ID');
    console.log(`  - Error: ${result4.error}\n`);
  } else {
    console.error('✗ Should have rejected invalid user ID');
  }

  // Test 6: Test with invalid material ID
  console.log('Test 6: Test with invalid material ID');
  const result5 = await createCompletionFromRemoteSync(
    testUser.id,
    99999,
    'remote-invalid'
  );

  if (!result5.success) {
    console.log('✓ Correctly rejected invalid material ID');
    console.log(`  - Error: ${result5.error}\n`);
  } else {
    console.error('✗ Should have rejected invalid material ID');
  }

  console.log('All tests completed successfully! ✓');
}

testRemoteSyncCompletion()
  .catch(console.error)
  .finally(() => process.exit());
