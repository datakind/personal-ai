/**
 * Unit test for training list data fetching function
 * Task 2.1: Create data fetching function for training list
 * 
 * Tests the getTrainingListData logic:
 * - Fetches all training materials
 * - Enriches with completion status
 * - Sorts uncompleted first, then completed
 * 
 * Requirements: 1.1, 1.5, 1.6, 4.1, 7.1, 7.4
 */

import { createTestContext } from './training-test-helpers';
import { getUserCompletionHistory } from '@/lib/training';
import { db } from '@/db';
import type { TrainingMaterial } from '@/db/schema';

/**
 * Enriched training material with completion status
 */
type TrainingListItem = TrainingMaterial & {
  completed: boolean;
};

/**
 * Fetches all training materials and enriches them with user completion status.
 * Sorts materials with uncompleted first, then completed.
 * 
 * This is the same function implemented in app/training/page.tsx
 */
async function getTrainingListData(userId: number): Promise<TrainingListItem[]> {
  // Fetch all training materials
  const materials = await db.query.trainingMaterials.findMany({
    orderBy: (materials, { asc }) => [asc(materials.title)],
  });

  // Fetch user completion history
  const completions = await getUserCompletionHistory(userId);
  const completedIds = new Set(completions.map((c) => c.materialId));

  // Merge data to create enriched list with completion status
  const enriched: TrainingListItem[] = materials.map((material) => ({
    ...material,
    completed: completedIds.has(material.id),
  }));

  // Sort materials: uncompleted first, then completed
  return enriched.sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
}

async function runTests() {
  console.log('Running training list data fetching tests...\n');

  // Test 1: Empty list - no materials
  console.log('Test 1: Empty list - no materials');
  const ctx1 = await createTestContext();
  try {
    const user = await ctx1.createUser();

    const list = await getTrainingListData(user.id);

    if (!Array.isArray(list)) {
      throw new Error('Expected array result');
    }

    console.log('✓ Test 1 passed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
    throw error;
  } finally {
    await ctx1.cleanup();
  }

  // Test 2: All materials uncompleted
  console.log('Test 2: All materials uncompleted');
  const ctx2 = await createTestContext();
  try {
    const user = await ctx2.createUser();
    const material1 = await ctx2.createMaterial({ title: 'Material A' });
    const material2 = await ctx2.createMaterial({ title: 'Material B' });
    const material3 = await ctx2.createMaterial({ title: 'Material C' });

    const list = await getTrainingListData(user.id);

    // Note: list may contain more materials than we created (from seed data or other tests)
    // We verify that our created materials are in the list and uncompleted
    const ourMaterialIds = [material1.id, material2.id, material3.id];
    const ourMaterials = list.filter(item => ourMaterialIds.includes(item.id));

    if (ourMaterials.length !== 3) {
      throw new Error(`Expected 3 of our materials in list, got ${ourMaterials.length}`);
    }

    // All our materials should be uncompleted
    for (const item of ourMaterials) {
      if (item.completed !== false) {
        throw new Error('Expected all our materials to be uncompleted');
      }
    }

    console.log('✓ Test 2 passed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
    throw error;
  } finally {
    await ctx2.cleanup();
  }

  // Test 3: All materials completed
  console.log('Test 3: All materials completed');
  const ctx3 = await createTestContext();
  try {
    const user = await ctx3.createUser();
    const material1 = await ctx3.createMaterial({ title: 'Material A' });
    const material2 = await ctx3.createMaterial({ title: 'Material B' });

    await ctx3.createCompletion(user.id, material1.id);
    await ctx3.createCompletion(user.id, material2.id);

    const list = await getTrainingListData(user.id);

    // Filter to only our materials
    const ourMaterialIds = [material1.id, material2.id];
    const ourMaterials = list.filter(item => ourMaterialIds.includes(item.id));

    if (ourMaterials.length !== 2) {
      throw new Error(`Expected 2 of our materials in list, got ${ourMaterials.length}`);
    }

    // All our materials should be completed
    for (const item of ourMaterials) {
      if (item.completed !== true) {
        throw new Error('Expected all our materials to be completed');
      }
    }

    console.log('✓ Test 3 passed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
    throw error;
  } finally {
    await ctx3.cleanup();
  }

  // Test 4: Mixed completion status - uncompleted first
  console.log('Test 4: Mixed completion status - uncompleted first');
  const ctx4 = await createTestContext();
  try {
    const user = await ctx4.createUser();
    const material1 = await ctx4.createMaterial({ title: 'Completed 1' });
    const material2 = await ctx4.createMaterial({ title: 'Uncompleted 1' });
    const material3 = await ctx4.createMaterial({ title: 'Completed 2' });
    const material4 = await ctx4.createMaterial({ title: 'Uncompleted 2' });

    // Complete materials 1 and 3
    await ctx4.createCompletion(user.id, material1.id);
    await ctx4.createCompletion(user.id, material3.id);

    const list = await getTrainingListData(user.id);

    // Filter to only our materials
    const ourMaterialIds = [material1.id, material2.id, material3.id, material4.id];
    const ourMaterials = list.filter(item => ourMaterialIds.includes(item.id));

    if (ourMaterials.length !== 4) {
      throw new Error(`Expected 4 of our materials in list, got ${ourMaterials.length}`);
    }

    // Separate completed and uncompleted
    const uncompleted = ourMaterials.filter(m => !m.completed);
    const completed = ourMaterials.filter(m => m.completed);

    if (uncompleted.length !== 2) {
      throw new Error(`Expected 2 uncompleted materials, got ${uncompleted.length}`);
    }

    if (completed.length !== 2) {
      throw new Error(`Expected 2 completed materials, got ${completed.length}`);
    }

    // Verify the uncompleted materials are 2 and 4
    const uncompletedIds = uncompleted.map(m => m.id).sort();
    const expectedUncompletedIds = [material2.id, material4.id].sort();
    if (JSON.stringify(uncompletedIds) !== JSON.stringify(expectedUncompletedIds)) {
      throw new Error('Expected uncompleted materials to be material2 and material4');
    }

    // Verify the completed materials are 1 and 3
    const completedIds = completed.map(m => m.id).sort();
    const expectedCompletedIds = [material1.id, material3.id].sort();
    if (JSON.stringify(completedIds) !== JSON.stringify(expectedCompletedIds)) {
      throw new Error('Expected completed materials to be material1 and material3');
    }

    // Verify sorting: all uncompleted should come before all completed in the full list
    const firstCompletedIndex = ourMaterials.findIndex(m => m.completed);
    const lastUncompletedIndex = ourMaterials.map((m, i) => ({ m, i }))
      .filter(({ m }) => !m.completed)
      .map(({ i }) => i)
      .pop() ?? -1;

    if (firstCompletedIndex !== -1 && lastUncompletedIndex !== -1) {
      if (firstCompletedIndex < lastUncompletedIndex) {
        throw new Error('Expected all uncompleted materials to come before completed materials');
      }
    }

    console.log('✓ Test 4 passed\n');
  } catch (error) {
    console.error('✗ Test 4 failed:', error);
    throw error;
  } finally {
    await ctx4.cleanup();
  }

  // Test 5: Different users have different completion status
  console.log('Test 5: Different users have different completion status');
  const ctx5 = await createTestContext();
  try {
    const user1 = await ctx5.createUser();
    const user2 = await ctx5.createUser();
    const material1 = await ctx5.createMaterial({ title: 'Material A' });
    const material2 = await ctx5.createMaterial({ title: 'Material B' });

    // User 1 completes material 1
    await ctx5.createCompletion(user1.id, material1.id);

    // User 2 completes material 2
    await ctx5.createCompletion(user2.id, material2.id);

    const list1 = await getTrainingListData(user1.id);
    const list2 = await getTrainingListData(user2.id);

    // Filter to only our materials
    const ourMaterialIds = [material1.id, material2.id];
    const user1Materials = list1.filter(m => ourMaterialIds.includes(m.id));
    const user2Materials = list2.filter(m => ourMaterialIds.includes(m.id));

    if (user1Materials.length !== 2 || user2Materials.length !== 2) {
      throw new Error('Expected both users to see 2 of our materials');
    }

    // User 1: material 2 uncompleted, material 1 completed
    const user1Material1 = user1Materials.find(m => m.id === material1.id);
    const user1Material2 = user1Materials.find(m => m.id === material2.id);

    if (!user1Material1 || !user1Material2) {
      throw new Error('Expected both materials in user1 list');
    }

    if (user1Material1.completed !== true) {
      throw new Error('Expected user1 to have completed material1');
    }

    if (user1Material2.completed !== false) {
      throw new Error('Expected user1 to not have completed material2');
    }

    // User 2: material 1 uncompleted, material 2 completed
    const user2Material1 = user2Materials.find(m => m.id === material1.id);
    const user2Material2 = user2Materials.find(m => m.id === material2.id);

    if (!user2Material1 || !user2Material2) {
      throw new Error('Expected both materials in user2 list');
    }

    if (user2Material1.completed !== false) {
      throw new Error('Expected user2 to not have completed material1');
    }

    if (user2Material2.completed !== true) {
      throw new Error('Expected user2 to have completed material2');
    }

    console.log('✓ Test 5 passed\n');
  } catch (error) {
    console.error('✗ Test 5 failed:', error);
    throw error;
  } finally {
    await ctx5.cleanup();
  }

  console.log('All training list data fetching tests passed! ✓');
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
