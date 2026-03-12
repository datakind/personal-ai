/**
 * Unit tests for training materials CRUD operations
 * Task 9.2: Create unit test files for core operations
 * 
 * Tests the following functions from lib/training.ts:
 * - createTrainingMaterial()
 * - updateTrainingMaterial()
 * - deleteTrainingMaterial()
 * 
 * Requirements: All (testing infrastructure)
 */

import { createTestContext } from './training-test-helpers';
import {
  createTrainingMaterial,
  updateTrainingMaterial,
  deleteTrainingMaterial,
} from '@/lib/training';
import { db } from '@/db';
import { trainingMaterials } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function runTests() {
  console.log('Running training materials CRUD tests...\n');

  // Test 1: Create training material with valid data
  console.log('Test 1: Create training material with valid data');
  const ctx1 = await createTestContext();
  try {
    const result = await createTrainingMaterial(
      'Introduction to TypeScript',
      'Learn the basics of TypeScript programming',
      'programming'
    );

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    if (!result.material.id) {
      throw new Error('Expected material to have an ID');
    }

    if (result.material.title !== 'Introduction to TypeScript') {
      throw new Error('Expected title to match');
    }

    if (result.material.content !== 'Learn the basics of TypeScript programming') {
      throw new Error('Expected content to match');
    }

    if (result.material.categoryId !== 'programming') {
      throw new Error('Expected categoryId to match');
    }

    if (!(result.material.createdAt instanceof Date)) {
      throw new Error('Expected createdAt to be a Date');
    }

    if (!(result.material.updatedAt instanceof Date)) {
      throw new Error('Expected updatedAt to be a Date');
    }

    console.log('✓ Test 1 passed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
    throw error;
  } finally {
    await ctx1.cleanup();
  }

  // Test 2: Create training material with empty title should fail
  console.log('Test 2: Create training material with empty title should fail');
  const ctx2 = await createTestContext();
  try {
    const result = await createTrainingMaterial(
      '',
      'Some content',
      'category'
    );

    if (result.success) {
      throw new Error('Expected failure for empty title');
    }

    if (result.error !== 'Title is required and cannot be empty') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 2 passed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
    throw error;
  } finally {
    await ctx2.cleanup();
  }

  // Test 3: Create training material with empty content should fail
  console.log('Test 3: Create training material with empty content should fail');
  const ctx3 = await createTestContext();
  try {
    const result = await createTrainingMaterial(
      'Valid Title',
      '',
      'category'
    );

    if (result.success) {
      throw new Error('Expected failure for empty content');
    }

    if (result.error !== 'Content is required and cannot be empty') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 3 passed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
    throw error;
  } finally {
    await ctx3.cleanup();
  }

  // Test 4: Create training material with empty categoryId should fail
  console.log('Test 4: Create training material with empty categoryId should fail');
  const ctx4 = await createTestContext();
  try {
    const result = await createTrainingMaterial(
      'Valid Title',
      'Valid Content',
      ''
    );

    if (result.success) {
      throw new Error('Expected failure for empty categoryId');
    }

    if (result.error !== 'Category ID is required and cannot be empty') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 4 passed\n');
  } catch (error) {
    console.error('✗ Test 4 failed:', error);
    throw error;
  } finally {
    await ctx4.cleanup();
  }

  // Test 5: Update training material title
  console.log('Test 5: Update training material title');
  const ctx5 = await createTestContext();
  try {
    const material = await ctx5.createMaterial({
      title: 'Original Title',
      content: 'Original Content',
      categoryId: 'original-category',
    });

    const originalUpdatedAt = material.updatedAt.getTime();

    // Wait 1 second to ensure timestamp changes (SQLite uses second precision)
    await new Promise(resolve => setTimeout(resolve, 1100));

    const result = await updateTrainingMaterial(material.id, {
      title: 'Updated Title',
    });

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    if (result.material.title !== 'Updated Title') {
      throw new Error('Expected title to be updated');
    }

    if (result.material.content !== 'Original Content') {
      throw new Error('Expected content to remain unchanged');
    }

    if (result.material.categoryId !== 'original-category') {
      throw new Error('Expected categoryId to remain unchanged');
    }

    if (result.material.updatedAt.getTime() <= originalUpdatedAt) {
      throw new Error('Expected updatedAt to be more recent');
    }

    console.log('✓ Test 5 passed\n');
  } catch (error) {
    console.error('✗ Test 5 failed:', error);
    throw error;
  } finally {
    await ctx5.cleanup();
  }

  // Test 6: Update training material content
  console.log('Test 6: Update training material content');
  const ctx6 = await createTestContext();
  try {
    const material = await ctx6.createMaterial({
      title: 'Test Title',
      content: 'Original Content',
      categoryId: 'test-category',
    });

    const result = await updateTrainingMaterial(material.id, {
      content: 'Updated Content',
    });

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    if (result.material.content !== 'Updated Content') {
      throw new Error('Expected content to be updated');
    }

    console.log('✓ Test 6 passed\n');
  } catch (error) {
    console.error('✗ Test 6 failed:', error);
    throw error;
  } finally {
    await ctx6.cleanup();
  }

  // Test 7: Update training material categoryId
  console.log('Test 7: Update training material categoryId');
  const ctx7 = await createTestContext();
  try {
    const material = await ctx7.createMaterial({
      title: 'Test Title',
      content: 'Test Content',
      categoryId: 'original-category',
    });

    const result = await updateTrainingMaterial(material.id, {
      categoryId: 'updated-category',
    });

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    if (result.material.categoryId !== 'updated-category') {
      throw new Error('Expected categoryId to be updated');
    }

    console.log('✓ Test 7 passed\n');
  } catch (error) {
    console.error('✗ Test 7 failed:', error);
    throw error;
  } finally {
    await ctx7.cleanup();
  }

  // Test 8: Update with no fields should fail
  console.log('Test 8: Update with no fields should fail');
  const ctx8 = await createTestContext();
  try {
    const material = await ctx8.createMaterial();

    const result = await updateTrainingMaterial(material.id, {});

    if (result.success) {
      throw new Error('Expected failure when no fields provided');
    }

    if (result.error !== 'At least one field must be provided for update') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 8 passed\n');
  } catch (error) {
    console.error('✗ Test 8 failed:', error);
    throw error;
  } finally {
    await ctx8.cleanup();
  }

  // Test 9: Update with empty title should fail
  console.log('Test 9: Update with empty title should fail');
  const ctx9 = await createTestContext();
  try {
    const material = await ctx9.createMaterial();

    const result = await updateTrainingMaterial(material.id, {
      title: '   ',  // Whitespace-only string
    });

    if (result.success) {
      throw new Error('Expected failure for empty title');
    }

    if (result.error !== 'Title cannot be empty') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 9 passed\n');
  } catch (error) {
    console.error('✗ Test 9 failed:', error);
    throw error;
  } finally {
    await ctx9.cleanup();
  }

  // Test 10: Update non-existent material should fail
  console.log('Test 10: Update non-existent material should fail');
  const ctx10 = await createTestContext();
  try {
    const result = await updateTrainingMaterial(999999, {
      title: 'New Title',
    });

    if (result.success) {
      throw new Error('Expected failure for non-existent material');
    }

    if (result.error !== 'Training material not found') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 10 passed\n');
  } catch (error) {
    console.error('✗ Test 10 failed:', error);
    throw error;
  } finally {
    await ctx10.cleanup();
  }

  // Test 11: Delete training material
  console.log('Test 11: Delete training material');
  const ctx11 = await createTestContext();
  try {
    const material = await ctx11.createMaterial();

    const result = await deleteTrainingMaterial(material.id);

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    // Verify material is deleted
    const deletedMaterial = await db.query.trainingMaterials.findFirst({
      where: (materials, { eq }) => eq(materials.id, material.id),
    });

    if (deletedMaterial) {
      throw new Error('Expected material to be deleted');
    }

    console.log('✓ Test 11 passed\n');
  } catch (error) {
    console.error('✗ Test 11 failed:', error);
    throw error;
  } finally {
    await ctx11.cleanup();
  }

  // Test 12: Delete non-existent material should fail
  console.log('Test 12: Delete non-existent material should fail');
  const ctx12 = await createTestContext();
  try {
    const result = await deleteTrainingMaterial(999999);

    if (result.success) {
      throw new Error('Expected failure for non-existent material');
    }

    if (result.error !== 'Training material not found') {
      throw new Error(`Expected specific error message, got: ${result.error}`);
    }

    console.log('✓ Test 12 passed\n');
  } catch (error) {
    console.error('✗ Test 12 failed:', error);
    throw error;
  } finally {
    await ctx12.cleanup();
  }

  // Test 13: Delete material cascades to completions
  console.log('Test 13: Delete material cascades to completions');
  const ctx13 = await createTestContext();
  try {
    const user = await ctx13.createUser();
    const material = await ctx13.createMaterial();
    const completion = await ctx13.createCompletion(user.id, material.id);

    const result = await deleteTrainingMaterial(material.id);

    if (!result.success) {
      throw new Error(`Expected success, got error: ${result.error}`);
    }

    // Verify completion is also deleted (cascade)
    const deletedCompletion = await db.query.trainingCompletions.findFirst({
      where: (completions, { eq }) => eq(completions.id, completion.id),
    });

    if (deletedCompletion) {
      throw new Error('Expected completion to be cascade deleted');
    }

    console.log('✓ Test 13 passed\n');
  } catch (error) {
    console.error('✗ Test 13 failed:', error);
    throw error;
  } finally {
    await ctx13.cleanup();
  }

  console.log('All training materials CRUD tests passed! ✓');
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
