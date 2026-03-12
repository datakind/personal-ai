/**
 * Unit tests for training detail page data fetching
 * Task 3.1: Create data fetching function for training detail
 * 
 * Tests the data fetching logic used in app/training/[id]/page.tsx:
 * - Fetching training material by ID
 * - Checking user completion status
 * - Material ID validation
 * 
 * Validates: Requirements 2.4, 4.2, 6.4, 7.2
 */

import { createTestContext } from './training-test-helpers';
import { hasUserCompletedMaterial } from '@/lib/training';
import { db } from '@/db';

async function runTests() {
  console.log('Running training detail data fetching tests...\n');

  // Test 1: Fetch training material by valid ID
  console.log('Test 1: Fetch training material by valid ID');
  const ctx1 = await createTestContext();
  try {
    const material = await ctx1.createMaterial({
      title: 'Test Training Material',
      content: 'This is test content for the training material.',
      categoryId: 'test-category',
    });

    // Fetch material using the same query as the page component
    const fetchedMaterial = await db.query.trainingMaterials.findFirst({
      where: (materials, { eq }) => eq(materials.id, material.id),
    });

    if (!fetchedMaterial) {
      throw new Error('Expected material to be found');
    }

    if (fetchedMaterial.id !== material.id) {
      throw new Error('Expected material ID to match');
    }

    if (fetchedMaterial.title !== 'Test Training Material') {
      throw new Error('Expected title to match');
    }

    if (fetchedMaterial.content !== 'This is test content for the training material.') {
      throw new Error('Expected content to match');
    }

    if (fetchedMaterial.categoryId !== 'test-category') {
      throw new Error('Expected categoryId to match');
    }

    console.log('✓ Test 1 passed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
    throw error;
  } finally {
    await ctx1.cleanup();
  }

  // Test 2: Return undefined for non-existent material ID
  console.log('Test 2: Return undefined for non-existent material ID');
  const ctx2 = await createTestContext();
  try {
    const nonExistentId = 999999;
    
    const material = await db.query.trainingMaterials.findFirst({
      where: (materials, { eq }) => eq(materials.id, nonExistentId),
    });

    if (material !== undefined) {
      throw new Error('Expected material to be undefined for non-existent ID');
    }

    console.log('✓ Test 2 passed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
    throw error;
  } finally {
    await ctx2.cleanup();
  }

  // Test 3: Check completion status when not completed
  console.log('Test 3: Check completion status when not completed');
  const ctx3 = await createTestContext();
  try {
    const user = await ctx3.createUser();
    const material = await ctx3.createMaterial();

    const completed = await hasUserCompletedMaterial(user.id, material.id);
    
    if (completed !== false) {
      throw new Error('Expected completion status to be false');
    }

    console.log('✓ Test 3 passed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
    throw error;
  } finally {
    await ctx3.cleanup();
  }

  // Test 4: Check completion status when completed
  console.log('Test 4: Check completion status when completed');
  const ctx4 = await createTestContext();
  try {
    const user = await ctx4.createUser();
    const material = await ctx4.createMaterial();
    await ctx4.createCompletion(user.id, material.id);

    const completed = await hasUserCompletedMaterial(user.id, material.id);
    
    if (completed !== true) {
      throw new Error('Expected completion status to be true');
    }

    console.log('✓ Test 4 passed\n');
  } catch (error) {
    console.error('✗ Test 4 failed:', error);
    throw error;
  } finally {
    await ctx4.cleanup();
  }

  // Test 5: Validate material ID is integer (invalid cases)
  console.log('Test 5: Validate material ID is integer (invalid cases)');
  try {
    const invalidIds = ['abc', 'null', '', '  ', 'undefined'];
    
    for (const id of invalidIds) {
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed)) {
        throw new Error(`Expected "${id}" to parse as NaN, got ${parsed}`);
      }
    }

    console.log('✓ Test 5 passed\n');
  } catch (error) {
    console.error('✗ Test 5 failed:', error);
    throw error;
  }

  // Test 6: Validate material ID is valid integer (valid cases)
  console.log('Test 6: Validate material ID is valid integer (valid cases)');
  try {
    const validIds = ['1', '123', '999999', '12.5']; // parseInt handles decimals by truncating
    
    for (const id of validIds) {
      const parsed = parseInt(id, 10);
      if (isNaN(parsed)) {
        throw new Error(`Expected "${id}" to parse as valid integer`);
      }
      if (parsed <= 0) {
        throw new Error(`Expected "${id}" to parse as positive integer, got ${parsed}`);
      }
    }

    console.log('✓ Test 6 passed\n');
  } catch (error) {
    console.error('✗ Test 6 failed:', error);
    throw error;
  }

  console.log('All training detail data fetching tests passed! ✓');
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
