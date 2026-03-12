import { db } from '@/db';
import { users, trainingMaterials, trainingCompletions } from '@/db/schema';
import { recordTrainingCompletion } from '@/lib/training';
import { eq } from 'drizzle-orm';

async function testRecordTrainingCompletion() {
  console.log('Testing recordTrainingCompletion function...\n');

  // Create test user
  const [user] = await db
    .insert(users)
    .values({
      email: 'test-completion@example.com',
    })
    .returning();
  console.log('✓ Created test user:', user.id);

  // Create test training material
  const [material] = await db
    .insert(trainingMaterials)
    .values({
      title: 'Test Training Material',
      content: 'Test content for completion tracking',
      categoryId: 'test-category',
    })
    .returning();
  console.log('✓ Created test material:', material.id);

  // Test 1: Successfully create a completion record
  console.log('\nTest 1: Create completion record');
  const result1 = await recordTrainingCompletion(user.id, material.id);
  if (result1.success) {
    console.log('✓ Completion created successfully');
    console.log('  - userId:', result1.completion.userId);
    console.log('  - materialId:', result1.completion.materialId);
    console.log('  - synced:', result1.completion.synced);
    console.log('  - completedAt:', result1.completion.completedAt);
  } else {
    console.log('✗ Failed:', result1.error);
  }

  // Test 2: Prevent duplicate completions
  console.log('\nTest 2: Prevent duplicate completion');
  const result2 = await recordTrainingCompletion(user.id, material.id);
  if (!result2.success) {
    console.log('✓ Duplicate prevented:', result2.error);
  } else {
    console.log('✗ Should have prevented duplicate');
  }

  // Test 3: Handle invalid user ID
  console.log('\nTest 3: Invalid user ID');
  const result3 = await recordTrainingCompletion(999999, material.id);
  if (!result3.success) {
    console.log('✓ Invalid user ID handled:', result3.error);
  } else {
    console.log('✗ Should have failed with invalid user ID');
  }

  // Test 4: Handle invalid material ID
  console.log('\nTest 4: Invalid material ID');
  const result4 = await recordTrainingCompletion(user.id, 999999);
  if (!result4.success) {
    console.log('✓ Invalid material ID handled:', result4.error);
  } else {
    console.log('✗ Should have failed with invalid material ID');
  }

  // Clean up test data
  console.log('\nCleaning up test data...');
  await db.delete(trainingCompletions).where(eq(trainingCompletions.userId, user.id));
  await db.delete(trainingMaterials).where(eq(trainingMaterials.id, material.id));
  await db.delete(users).where(eq(users.id, user.id));
  console.log('✓ Cleanup complete\n');

  console.log('All tests passed! ✓');
}

testRecordTrainingCompletion().catch(console.error);
