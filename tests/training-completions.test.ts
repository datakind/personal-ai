/**
 * Unit tests for training completions CRUD operations
 * Task 9.2: Create unit test files for core operations
 * 
 * Tests the following functions from lib/training.ts:
 * - recordTrainingCompletion()
 * - markCompletionAsSynced()
 * - createCompletionFromRemoteSync()
 * 
 * Requirements: All (testing infrastructure)
 */

import { createTestContext } from './training-test-helpers';
import {
  recordTrainingCompletion,
  markCompletionAsSynced,
  createCompletionFromRemoteSync,
} from '@/lib/training';
import { db } from '@/db';

async function runTests() {
  console.log('Running training completions CRUD tests...\n');

  // Test 1: Record training completion with valid data
  console.log('Test 1: Record training completion with valid data');
  const ctx1 = await createTestContext();
  try {
    const user = await ctx1.createUser();
    const material = await ctx1.createMaterial();

    const result = await recordTrainingCompletion(user.id, material.id);

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    if (result.completion.userId !== user.id) {
      throw new Error('Expected userId to match');
    }

    if (result.completion.materialId !== material.id) {
      throw new Error('Expected materialId to match');
    }

    if (result.completion.synced !== false) {
      throw new Error('Expected synced to be false by default');
    }

    if (result.completion.lastSyncedAt !== null) {
      throw new Error('Expected lastSyncedAt to be null');
    }

    if (result.completion.remoteId !== null) {
      throw new Error('Expected remoteId to be null');
    }

    if (!(result.completion.completedAt instanceof Date)) {
      throw new Error('Expected completedAt to be a Date');
    }

    console.log('✓ Test 1 passed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
    throw error;
  } finally {
    await ctx1.cleanup();
  }

  // Test 2: Prevent duplicate completions
  console.log('Test 2: Prevent duplicate completions');
  const ctx2 = await createTestContext();
  try {
    const user = await ctx2.createUser();
    const material = await ctx2.createMaterial();

    // First completion should succeed
    const result1 = await recordTrainingCompletion(user.id, material.id);
    if (!result1.success) {
      throw new Error('Expected first completion to succeed');
    }

    // Second completion should fail
    const result2 = await recordTrainingCompletion(user.id, material.id);
    if (result2.success) {
      throw new Error('Expected second completion to fail');
    }

    if (result2.error !== 'Training has already been completed by this user') {
      throw new Error(`Expected specific error message, got: ${result2.error}`);
    }

    console.log('✓ Test 2 passed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
    throw error;
  } finally {
    await ctx2.cleanup();
  }

  // Test 3: Record completion with invalid user ID should fail
  console.log('Test 3: Record completion with invalid user ID should fail');
  const ctx3 = await createTestContext();
  try {
    const material = await ctx3.createMaterial();

    const result = await recordTrainingCompletion(999999, material.id);

    if (result.success) {
      throw new Error('Expected failure for invalid user ID');
    }

    if (result.error !== 'Invalid user ID or material ID') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 3 passed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
    throw error;
  } finally {
    await ctx3.cleanup();
  }

  // Test 4: Record completion with invalid material ID should fail
  console.log('Test 4: Record completion with invalid material ID should fail');
  const ctx4 = await createTestContext();
  try {
    const user = await ctx4.createUser();

    const result = await recordTrainingCompletion(user.id, 999999);

    if (result.success) {
      throw new Error('Expected failure for invalid material ID');
    }

    if (result.error !== 'Invalid user ID or material ID') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 4 passed\n');
  } catch (error) {
    console.error('✗ Test 4 failed:', error);
    throw error;
  } finally {
    await ctx4.cleanup();
  }

  // Test 5: Mark completion as synced without remoteId
  console.log('Test 5: Mark completion as synced without remoteId');
  const ctx5 = await createTestContext();
  try {
    const user = await ctx5.createUser();
    const material = await ctx5.createMaterial();
    const completion = await ctx5.createCompletion(user.id, material.id);

    const result = await markCompletionAsSynced(completion.id);

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    if (result.completion.synced !== true) {
      throw new Error('Expected synced to be true');
    }

    if (!(result.completion.lastSyncedAt instanceof Date)) {
      throw new Error('Expected lastSyncedAt to be a Date');
    }

    if (result.completion.remoteId !== null) {
      throw new Error('Expected remoteId to remain null');
    }

    console.log('✓ Test 5 passed\n');
  } catch (error) {
    console.error('✗ Test 5 failed:', error);
    throw error;
  } finally {
    await ctx5.cleanup();
  }

  // Test 6: Mark completion as synced with remoteId
  console.log('Test 6: Mark completion as synced with remoteId');
  const ctx6 = await createTestContext();
  try {
    const user = await ctx6.createUser();
    const material = await ctx6.createMaterial();
    const completion = await ctx6.createCompletion(user.id, material.id);

    const remoteId = 'remote-123-abc';
    const result = await markCompletionAsSynced(completion.id, remoteId);

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    if (result.completion.synced !== true) {
      throw new Error('Expected synced to be true');
    }

    if (!(result.completion.lastSyncedAt instanceof Date)) {
      throw new Error('Expected lastSyncedAt to be a Date');
    }

    if (result.completion.remoteId !== remoteId) {
      throw new Error('Expected remoteId to match');
    }

    console.log('✓ Test 6 passed\n');
  } catch (error) {
    console.error('✗ Test 6 failed:', error);
    throw error;
  } finally {
    await ctx6.cleanup();
  }

  // Test 7: Mark non-existent completion as synced should fail
  console.log('Test 7: Mark non-existent completion as synced should fail');
  const ctx7 = await createTestContext();
  try {
    const result = await markCompletionAsSynced(999999);

    if (result.success) {
      throw new Error('Expected failure for non-existent completion');
    }

    if (result.error !== 'Completion record not found') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 7 passed\n');
  } catch (error) {
    console.error('✗ Test 7 failed:', error);
    throw error;
  } finally {
    await ctx7.cleanup();
  }

  // Test 8: Create completion from remote sync
  console.log('Test 8: Create completion from remote sync');
  const ctx8 = await createTestContext();
  try {
    const user = await ctx8.createUser();
    const material = await ctx8.createMaterial();

    const remoteId = 'remote-456-def';
    const completedAt = new Date('2024-01-15T10:00:00Z');
    const result = await createCompletionFromRemoteSync(
      user.id,
      material.id,
      remoteId,
      completedAt
    );

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    if (result.completion.userId !== user.id) {
      throw new Error('Expected userId to match');
    }

    if (result.completion.materialId !== material.id) {
      throw new Error('Expected materialId to match');
    }

    if (result.completion.synced !== true) {
      throw new Error('Expected synced to be true');
    }

    if (result.completion.remoteId !== remoteId) {
      throw new Error('Expected remoteId to match');
    }

    if (!(result.completion.lastSyncedAt instanceof Date)) {
      throw new Error('Expected lastSyncedAt to be a Date');
    }

    if (result.completion.completedAt.getTime() !== completedAt.getTime()) {
      throw new Error('Expected completedAt to match provided timestamp');
    }

    console.log('✓ Test 8 passed\n');
  } catch (error) {
    console.error('✗ Test 8 failed:', error);
    throw error;
  } finally {
    await ctx8.cleanup();
  }

  // Test 9: Create completion from remote sync without completedAt
  console.log('Test 9: Create completion from remote sync without completedAt');
  const ctx9 = await createTestContext();
  try {
    const user = await ctx9.createUser();
    const material = await ctx9.createMaterial();

    const remoteId = 'remote-789-ghi';
    const beforeTime = Date.now();
    const result = await createCompletionFromRemoteSync(
      user.id,
      material.id,
      remoteId
    );
    const afterTime = Date.now();

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    const completedAtTime = result.completion.completedAt.getTime();
    // Allow 5 second window for test execution
    if (completedAtTime < beforeTime - 5000 || completedAtTime > afterTime + 5000) {
      throw new Error('Expected completedAt to default to current time');
    }

    console.log('✓ Test 9 passed\n');
  } catch (error) {
    console.error('✗ Test 9 failed:', error);
    throw error;
  } finally {
    await ctx9.cleanup();
  }

  // Test 10: Create completion from remote sync with existing local completion
  console.log('Test 10: Create completion from remote sync with existing local completion');
  const ctx10 = await createTestContext();
  try {
    const user = await ctx10.createUser();
    const material = await ctx10.createMaterial();

    // Create local completion first
    const localCompletion = await ctx10.createCompletion(user.id, material.id, {
      synced: false,
    });

    // Try to create from remote sync
    const remoteId = 'remote-existing-123';
    const result = await createCompletionFromRemoteSync(
      user.id,
      material.id,
      remoteId
    );

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    // Should update existing completion with sync metadata
    if (result.completion.id !== localCompletion.id) {
      throw new Error('Expected to update existing completion');
    }

    if (result.completion.synced !== true) {
      throw new Error('Expected synced to be updated to true');
    }

    if (result.completion.remoteId !== remoteId) {
      throw new Error('Expected remoteId to be set');
    }

    if (!(result.completion.lastSyncedAt instanceof Date)) {
      throw new Error('Expected lastSyncedAt to be set');
    }

    console.log('✓ Test 10 passed\n');
  } catch (error) {
    console.error('✗ Test 10 failed:', error);
    throw error;
  } finally {
    await ctx10.cleanup();
  }

  // Test 11: Create completion from remote sync with invalid user ID
  console.log('Test 11: Create completion from remote sync with invalid user ID');
  const ctx11 = await createTestContext();
  try {
    const material = await ctx11.createMaterial();

    const result = await createCompletionFromRemoteSync(
      999999,
      material.id,
      'remote-invalid-user'
    );

    if (result.success) {
      throw new Error('Expected failure for invalid user ID');
    }

    if (result.error !== 'Invalid user ID or material ID') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 11 passed\n');
  } catch (error) {
    console.error('✗ Test 11 failed:', error);
    throw error;
  } finally {
    await ctx11.cleanup();
  }

  // Test 12: Create completion from remote sync with invalid material ID
  console.log('Test 12: Create completion from remote sync with invalid material ID');
  const ctx12 = await createTestContext();
  try {
    const user = await ctx12.createUser();

    const result = await createCompletionFromRemoteSync(
      user.id,
      999999,
      'remote-invalid-material'
    );

    if (result.success) {
      throw new Error('Expected failure for invalid material ID');
    }

    if (result.error !== 'Invalid user ID or material ID') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 12 passed\n');
  } catch (error) {
    console.error('✗ Test 12 failed:', error);
    throw error;
  } finally {
    await ctx12.cleanup();
  }

  console.log('All training completions CRUD tests passed! ✓');
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
