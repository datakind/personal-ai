import { db } from '@/db';
import { users } from '@/db/schema';
import {
  createTrainingMaterial,
  recordTrainingCompletion,
  deleteTrainingMaterial,
  getMaterialCompletions,
} from '@/lib/training';

async function testDeleteMaterial() {
  console.log('Testing deleteTrainingMaterial function...\n');

  try {
    // Step 1: Create a test user
    console.log('Step 1: Creating test user...');
    const [testUser] = await db
      .insert(users)
      .values({
        email: `test-delete-${Date.now()}@example.com`,
      })
      .returning();
    console.log(`✓ Created user with ID: ${testUser.id}\n`);

    // Step 2: Create a test training material
    console.log('Step 2: Creating test training material...');
    const materialResult = await createTrainingMaterial(
      'Test Material for Deletion',
      'This material will be deleted to test cascade behavior',
      'test-category'
    );

    if (!materialResult.success) {
      throw new Error(`Failed to create material: ${materialResult.error}`);
    }

    const material = materialResult.material;
    console.log(`✓ Created material with ID: ${material.id}\n`);

    // Step 3: Create completion records for this material
    console.log('Step 3: Creating completion records...');
    const completionResult = await recordTrainingCompletion(
      testUser.id,
      material.id
    );

    if (!completionResult.success) {
      throw new Error(
        `Failed to create completion: ${completionResult.error}`
      );
    }

    console.log(`✓ Created completion record\n`);

    // Step 4: Verify completion exists
    console.log('Step 4: Verifying completion exists...');
    const completionsBefore = await getMaterialCompletions(material.id);
    console.log(`✓ Found ${completionsBefore.length} completion(s) before deletion\n`);

    // Step 5: Delete the training material
    console.log('Step 5: Deleting training material...');
    const deleteResult = await deleteTrainingMaterial(material.id);

    if (!deleteResult.success) {
      throw new Error(`Failed to delete material: ${deleteResult.error}`);
    }

    console.log(`✓ Material deleted successfully\n`);

    // Step 6: Verify cascade delete removed completions
    console.log('Step 6: Verifying cascade delete removed completions...');
    const completionsAfter = await getMaterialCompletions(material.id);
    console.log(`✓ Found ${completionsAfter.length} completion(s) after deletion\n`);

    if (completionsAfter.length === 0) {
      console.log('✅ SUCCESS: Cascade delete worked correctly!\n');
    } else {
      console.log('❌ FAILURE: Completions were not deleted!\n');
    }

    // Step 7: Test deleting non-existent material
    console.log('Step 7: Testing deletion of non-existent material...');
    const deleteNonExistentResult = await deleteTrainingMaterial(999999);

    if (!deleteNonExistentResult.success) {
      console.log(`✓ Correctly returned error: ${deleteNonExistentResult.error}\n`);
    } else {
      console.log('❌ Should have returned error for non-existent material\n');
    }

    // Cleanup: Delete test user
    console.log('Cleanup: Deleting test user...');
    const { eq } = await import('drizzle-orm');
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log('✓ Test user deleted\n');

    console.log('All tests completed successfully! ✅');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

testDeleteMaterial();
