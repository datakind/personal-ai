import { createTrainingMaterial, updateTrainingMaterial } from '@/lib/training';
import { db } from '@/db';
import { trainingMaterials } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function testUpdateMaterial() {
  console.log('Testing updateTrainingMaterial function...\n');

  try {
    // Test 1: Create a material to update
    console.log('Test 1: Creating initial material...');
    const createResult = await createTrainingMaterial(
      'Original Title',
      'Original content for testing',
      'test-category'
    );

    if (!createResult.success) {
      console.error('❌ Failed to create material:', createResult.error);
      return;
    }

    const materialId = createResult.material.id;
    const originalUpdatedAt = createResult.material.updatedAt;
    console.log('✅ Created material:', {
      id: materialId,
      title: createResult.material.title,
      updatedAt: originalUpdatedAt,
    });

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Update title only
    console.log('\nTest 2: Updating title only...');
    const updateResult1 = await updateTrainingMaterial(materialId, {
      title: 'Updated Title',
    });

    if (!updateResult1.success) {
      console.error('❌ Failed to update material:', updateResult1.error);
      return;
    }

    console.log('✅ Updated material:', {
      id: updateResult1.material.id,
      title: updateResult1.material.title,
      content: updateResult1.material.content,
      categoryId: updateResult1.material.categoryId,
      updatedAt: updateResult1.material.updatedAt,
    });

    // Verify updatedAt changed
    if (updateResult1.material.updatedAt > originalUpdatedAt) {
      console.log('✅ updatedAt timestamp was automatically updated');
    } else {
      console.error('❌ updatedAt timestamp was not updated');
    }

    // Test 3: Update multiple fields
    console.log('\nTest 3: Updating multiple fields...');
    const previousUpdatedAt = updateResult1.material.updatedAt;
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updateResult2 = await updateTrainingMaterial(materialId, {
      title: 'Final Title',
      content: 'Updated content',
      categoryId: 'new-category',
    });

    if (!updateResult2.success) {
      console.error('❌ Failed to update material:', updateResult2.error);
      return;
    }

    console.log('✅ Updated material:', {
      id: updateResult2.material.id,
      title: updateResult2.material.title,
      content: updateResult2.material.content,
      categoryId: updateResult2.material.categoryId,
      updatedAt: updateResult2.material.updatedAt,
    });

    if (updateResult2.material.updatedAt >= previousUpdatedAt) {
      console.log('✅ updatedAt timestamp increased after second update');
    } else {
      console.error('❌ updatedAt timestamp did not increase');
    }

    // Test 4: Update non-existent material
    console.log('\nTest 4: Attempting to update non-existent material...');
    const updateResult3 = await updateTrainingMaterial(99999, {
      title: 'Should fail',
    });

    if (!updateResult3.success && updateResult3.error === 'Training material not found') {
      console.log('✅ Correctly returned error for non-existent material');
    } else {
      console.error('❌ Did not handle non-existent material correctly');
    }

    // Test 5: Update with empty values
    console.log('\nTest 5: Attempting to update with empty title...');
    const updateResult4 = await updateTrainingMaterial(materialId, {
      title: '   ',
    });

    if (!updateResult4.success && updateResult4.error === 'Title cannot be empty') {
      console.log('✅ Correctly rejected empty title');
    } else {
      console.error('❌ Did not validate empty title correctly');
    }

    // Test 6: Update with no fields
    console.log('\nTest 6: Attempting to update with no fields...');
    const updateResult5 = await updateTrainingMaterial(materialId, {});

    if (!updateResult5.success && updateResult5.error === 'At least one field must be provided for update') {
      console.log('✅ Correctly rejected update with no fields');
    } else {
      console.error('❌ Did not validate empty update correctly');
    }

    // Cleanup
    console.log('\nCleaning up test data...');
    await db.delete(trainingMaterials).where(eq(trainingMaterials.id, materialId));
    console.log('✅ Test data cleaned up');

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  }
}

testUpdateMaterial()
  .then(() => {
    console.log('\nTest script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest script failed:', error);
    process.exit(1);
  });
