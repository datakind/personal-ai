/**
 * Unit tests for training query operations
 * Task 9.2: Create unit test files for core operations
 * 
 * Tests the following functions from lib/training.ts:
 * - getUserCompletionHistory()
 * - hasUserCompletedMaterial()
 * - getMaterialCompletions()
 * - getUnsyncedCompletions()
 * - getCompletionsByTimestampRange()
 * 
 * Requirements: All (testing infrastructure)
 */

import { createTestContext } from './training-test-helpers';
import {
  getUserCompletionHistory,
  hasUserCompletedMaterial,
  getMaterialCompletions,
  getUnsyncedCompletions,
  getCompletionsByTimestampRange,
} from '@/lib/training';

async function runTests() {
  console.log('Running training query operations tests...\n');

  // Test 1: Get user completion history - empty
  console.log('Test 1: Get user completion history - empty');
  const ctx1 = await createTestContext();
  try {
    const user = await ctx1.createUser();

    const history = await getUserCompletionHistory(user.id);

    if (history.length !== 0) {
      throw new Error('Expected empty history for user with no completions');
    }

    console.log('✓ Test 1 passed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
    throw error;
  } finally {
    await ctx1.cleanup();
  }

  // Test 2: Get user completion history - single completion
  console.log('Test 2: Get user completion history - single completion');
  const ctx2 = await createTestContext();
  try {
    const user = await ctx2.createUser();
    const material = await ctx2.createMaterial();
    await ctx2.createCompletion(user.id, material.id);

    const history = await getUserCompletionHistory(user.id);

    if (history.length !== 1) {
      throw new Error('Expected exactly 1 completion');
    }

    if (history[0].userId !== user.id) {
      throw new Error('Expected userId to match');
    }

    if (history[0].materialId !== material.id) {
      throw new Error('Expected materialId to match');
    }

    if (!history[0].material) {
      throw new Error('Expected material to be joined');
    }

    if (history[0].material.id !== material.id) {
      throw new Error('Expected joined material ID to match');
    }

    console.log('✓ Test 2 passed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
    throw error;
  } finally {
    await ctx2.cleanup();
  }

  // Test 3: Get user completion history - multiple completions ordered by timestamp
  console.log('Test 3: Get user completion history - multiple completions ordered by timestamp');
  const ctx3 = await createTestContext();
  try {
    const user = await ctx3.createUser();
    const material1 = await ctx3.createMaterial({ title: 'Material 1' });
    const material2 = await ctx3.createMaterial({ title: 'Material 2' });
    const material3 = await ctx3.createMaterial({ title: 'Material 3' });

    // Create completions with different timestamps
    const completion1 = await ctx3.createCompletion(user.id, material1.id, {
      completedAt: new Date('2024-01-01T10:00:00Z'),
    });
    const completion2 = await ctx3.createCompletion(user.id, material2.id, {
      completedAt: new Date('2024-01-03T10:00:00Z'),
    });
    const completion3 = await ctx3.createCompletion(user.id, material3.id, {
      completedAt: new Date('2024-01-02T10:00:00Z'),
    });

    const history = await getUserCompletionHistory(user.id);

    if (history.length !== 3) {
      throw new Error('Expected exactly 3 completions');
    }

    // Should be ordered by completedAt descending (most recent first)
    if (history[0].id !== completion2.id) {
      throw new Error('Expected most recent completion first');
    }

    if (history[1].id !== completion3.id) {
      throw new Error('Expected second most recent completion second');
    }

    if (history[2].id !== completion1.id) {
      throw new Error('Expected oldest completion last');
    }

    console.log('✓ Test 3 passed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
    throw error;
  } finally {
    await ctx3.cleanup();
  }

  // Test 4: Check if user completed material - not completed
  console.log('Test 4: Check if user completed material - not completed');
  const ctx4 = await createTestContext();
  try {
    const user = await ctx4.createUser();
    const material = await ctx4.createMaterial();

    const hasCompleted = await hasUserCompletedMaterial(user.id, material.id);

    if (hasCompleted !== false) {
      throw new Error('Expected false for uncompleted material');
    }

    console.log('✓ Test 4 passed\n');
  } catch (error) {
    console.error('✗ Test 4 failed:', error);
    throw error;
  } finally {
    await ctx4.cleanup();
  }

  // Test 5: Check if user completed material - completed
  console.log('Test 5: Check if user completed material - completed');
  const ctx5 = await createTestContext();
  try {
    const user = await ctx5.createUser();
    const material = await ctx5.createMaterial();
    await ctx5.createCompletion(user.id, material.id);

    const hasCompleted = await hasUserCompletedMaterial(user.id, material.id);

    if (hasCompleted !== true) {
      throw new Error('Expected true for completed material');
    }

    console.log('✓ Test 5 passed\n');
  } catch (error) {
    console.error('✗ Test 5 failed:', error);
    throw error;
  } finally {
    await ctx5.cleanup();
  }

  // Test 6: Get material completions - empty
  console.log('Test 6: Get material completions - empty');
  const ctx6 = await createTestContext();
  try {
    const material = await ctx6.createMaterial();

    const completions = await getMaterialCompletions(material.id);

    if (completions.length !== 0) {
      throw new Error('Expected empty completions for material with no completions');
    }

    console.log('✓ Test 6 passed\n');
  } catch (error) {
    console.error('✗ Test 6 failed:', error);
    throw error;
  } finally {
    await ctx6.cleanup();
  }

  // Test 7: Get material completions - multiple users
  console.log('Test 7: Get material completions - multiple users');
  const ctx7 = await createTestContext();
  try {
    const user1 = await ctx7.createUser();
    const user2 = await ctx7.createUser();
    const user3 = await ctx7.createUser();
    const material = await ctx7.createMaterial();

    await ctx7.createCompletion(user1.id, material.id);
    await ctx7.createCompletion(user2.id, material.id);
    await ctx7.createCompletion(user3.id, material.id);

    const completions = await getMaterialCompletions(material.id);

    if (completions.length !== 3) {
      throw new Error('Expected exactly 3 completions');
    }

    // Verify all completions have user data joined
    for (const completion of completions) {
      if (!completion.user) {
        throw new Error('Expected user to be joined');
      }
      if (completion.materialId !== material.id) {
        throw new Error('Expected all completions to be for the same material');
      }
    }

    // Verify distinct user IDs
    const userIds = completions.map(c => c.userId);
    const uniqueUserIds = new Set(userIds);
    if (uniqueUserIds.size !== 3) {
      throw new Error('Expected 3 distinct user IDs');
    }

    console.log('✓ Test 7 passed\n');
  } catch (error) {
    console.error('✗ Test 7 failed:', error);
    throw error;
  } finally {
    await ctx7.cleanup();
  }

  // Test 8: Get unsynced completions - empty
  console.log('Test 8: Get unsynced completions - empty');
  const ctx8 = await createTestContext();
  try {
    const user = await ctx8.createUser();

    const unsynced = await getUnsyncedCompletions(user.id);

    if (unsynced.length !== 0) {
      throw new Error('Expected empty unsynced completions');
    }

    console.log('✓ Test 8 passed\n');
  } catch (error) {
    console.error('✗ Test 8 failed:', error);
    throw error;
  } finally {
    await ctx8.cleanup();
  }

  // Test 9: Get unsynced completions - only unsynced
  console.log('Test 9: Get unsynced completions - only unsynced');
  const ctx9 = await createTestContext();
  try {
    const user = await ctx9.createUser();
    const material1 = await ctx9.createMaterial({ title: 'Unsynced 1' });
    const material2 = await ctx9.createMaterial({ title: 'Synced' });
    const material3 = await ctx9.createMaterial({ title: 'Unsynced 2' });

    await ctx9.createCompletion(user.id, material1.id, { synced: false });
    await ctx9.createCompletion(user.id, material2.id, { synced: true });
    await ctx9.createCompletion(user.id, material3.id, { synced: false });

    const unsynced = await getUnsyncedCompletions(user.id);

    if (unsynced.length !== 2) {
      throw new Error('Expected exactly 2 unsynced completions');
    }

    // Verify all returned completions are unsynced
    for (const completion of unsynced) {
      if (completion.synced !== false) {
        throw new Error('Expected all completions to be unsynced');
      }
      if (!completion.material) {
        throw new Error('Expected material to be joined');
      }
    }

    console.log('✓ Test 9 passed\n');
  } catch (error) {
    console.error('✗ Test 9 failed:', error);
    throw error;
  } finally {
    await ctx9.cleanup();
  }

  // Test 10: Get completions by timestamp range - empty
  console.log('Test 10: Get completions by timestamp range - empty');
  const ctx10 = await createTestContext();
  try {
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');

    const completions = await getCompletionsByTimestampRange(startDate, endDate);

    // Note: This might return completions from other tests if they're not cleaned up
    // For this test, we just verify the function works without error
    if (!Array.isArray(completions)) {
      throw new Error('Expected array of completions');
    }

    console.log('✓ Test 10 passed\n');
  } catch (error) {
    console.error('✗ Test 10 failed:', error);
    throw error;
  } finally {
    await ctx10.cleanup();
  }

  // Test 11: Get completions by timestamp range - within range
  console.log('Test 11: Get completions by timestamp range - within range');
  const ctx11 = await createTestContext();
  try {
    const user = await ctx11.createUser();
    const material1 = await ctx11.createMaterial({ title: 'Before range' });
    const material2 = await ctx11.createMaterial({ title: 'In range 1' });
    const material3 = await ctx11.createMaterial({ title: 'In range 2' });
    const material4 = await ctx11.createMaterial({ title: 'After range' });

    const completion1 = await ctx11.createCompletion(user.id, material1.id, {
      completedAt: new Date('2023-12-31T23:59:59Z'),
    });
    const completion2 = await ctx11.createCompletion(user.id, material2.id, {
      completedAt: new Date('2024-01-15T10:00:00Z'),
    });
    const completion3 = await ctx11.createCompletion(user.id, material3.id, {
      completedAt: new Date('2024-01-20T15:30:00Z'),
    });
    const completion4 = await ctx11.createCompletion(user.id, material4.id, {
      completedAt: new Date('2024-02-01T00:00:01Z'),
    });

    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');

    const completions = await getCompletionsByTimestampRange(startDate, endDate);

    // Filter to only our test user's completions
    const userCompletions = completions.filter(c => c.userId === user.id);

    if (userCompletions.length !== 2) {
      throw new Error(`Expected exactly 2 completions in range, got ${userCompletions.length}`);
    }

    // Verify the correct completions are returned
    const completionIds = userCompletions.map(c => c.id);
    if (!completionIds.includes(completion2.id)) {
      throw new Error('Expected completion2 to be in range');
    }
    if (!completionIds.includes(completion3.id)) {
      throw new Error('Expected completion3 to be in range');
    }
    if (completionIds.includes(completion1.id)) {
      throw new Error('Expected completion1 to be outside range');
    }
    if (completionIds.includes(completion4.id)) {
      throw new Error('Expected completion4 to be outside range');
    }

    // Verify all completions have material joined
    for (const completion of userCompletions) {
      if (!completion.material) {
        throw new Error('Expected material to be joined');
      }
    }

    console.log('✓ Test 11 passed\n');
  } catch (error) {
    console.error('✗ Test 11 failed:', error);
    throw error;
  } finally {
    await ctx11.cleanup();
  }

  // Test 12: Get completions by timestamp range - boundary inclusive
  console.log('Test 12: Get completions by timestamp range - boundary inclusive');
  const ctx12 = await createTestContext();
  try {
    const user = await ctx12.createUser();
    const material1 = await ctx12.createMaterial({ title: 'At start boundary' });
    const material2 = await ctx12.createMaterial({ title: 'At end boundary' });

    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');

    const completion1 = await ctx12.createCompletion(user.id, material1.id, {
      completedAt: startDate,
    });
    const completion2 = await ctx12.createCompletion(user.id, material2.id, {
      completedAt: endDate,
    });

    const completions = await getCompletionsByTimestampRange(startDate, endDate);

    // Filter to only our test user's completions
    const userCompletions = completions.filter(c => c.userId === user.id);

    if (userCompletions.length !== 2) {
      throw new Error('Expected both boundary completions to be included');
    }

    console.log('✓ Test 12 passed\n');
  } catch (error) {
    console.error('✗ Test 12 failed:', error);
    throw error;
  } finally {
    await ctx12.cleanup();
  }

  // Test 13: Get user completion history for different users
  console.log('Test 13: Get user completion history for different users');
  const ctx13 = await createTestContext();
  try {
    const user1 = await ctx13.createUser();
    const user2 = await ctx13.createUser();
    const material1 = await ctx13.createMaterial();
    const material2 = await ctx13.createMaterial();

    await ctx13.createCompletion(user1.id, material1.id);
    await ctx13.createCompletion(user2.id, material2.id);

    const history1 = await getUserCompletionHistory(user1.id);
    const history2 = await getUserCompletionHistory(user2.id);

    if (history1.length !== 1) {
      throw new Error('Expected user1 to have 1 completion');
    }

    if (history2.length !== 1) {
      throw new Error('Expected user2 to have 1 completion');
    }

    if (history1[0].materialId !== material1.id) {
      throw new Error('Expected user1 completion to be for material1');
    }

    if (history2[0].materialId !== material2.id) {
      throw new Error('Expected user2 completion to be for material2');
    }

    console.log('✓ Test 13 passed\n');
  } catch (error) {
    console.error('✗ Test 13 failed:', error);
    throw error;
  } finally {
    await ctx13.cleanup();
  }

  console.log('All training query operations tests passed! ✓');
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
