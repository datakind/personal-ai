import { db } from '@/db';
import { users, trainingMaterials } from '@/db/schema';
import { recordTrainingCompletion, getMaterialCompletions } from '@/lib/training';
import { eq } from 'drizzle-orm';

async function testMaterialCompletions() {
  console.log('Testing getMaterialCompletions function...\n');

  // Create test users
  const [user1] = await db
    .insert(users)
    .values({ email: 'test-user1@example.com' })
    .returning();
  console.log(`✓ Created test user 1: ${user1.email} (ID: ${user1.id})`);

  const [user2] = await db
    .insert(users)
    .values({ email: 'test-user2@example.com' })
    .returning();
  console.log(`✓ Created test user 2: ${user2.email} (ID: ${user2.id})`);

  const [user3] = await db
    .insert(users)
    .values({ email: 'test-user3@example.com' })
    .returning();
  console.log(`✓ Created test user 3: ${user3.email} (ID: ${user3.id})\n`);

  // Create test training material
  const [material] = await db
    .insert(trainingMaterials)
    .values({
      title: 'Test Training Material',
      content: 'Test content for material completions',
      categoryId: 'test-category',
    })
    .returning();
  console.log(`✓ Created test material: ${material.title} (ID: ${material.id})\n`);

  // Record completions for users 1 and 2
  const result1 = await recordTrainingCompletion(user1.id, material.id);
  if (result1.success) {
    console.log(`✓ User 1 completed material at ${result1.completion.completedAt}`);
  }

  const result2 = await recordTrainingCompletion(user2.id, material.id);
  if (result2.success) {
    console.log(`✓ User 2 completed material at ${result2.completion.completedAt}\n`);
  }

  // Test getMaterialCompletions
  console.log('Testing getMaterialCompletions...');
  const completions = await getMaterialCompletions(material.id);

  console.log(`\n✓ Found ${completions.length} completions for material ${material.id}`);
  
  if (completions.length !== 2) {
    console.error(`✗ Expected 2 completions, got ${completions.length}`);
    process.exit(1);
  }

  // Verify user data is joined
  for (const completion of completions) {
    if (!completion.user) {
      console.error('✗ User data not joined in completion record');
      process.exit(1);
    }
    console.log(`  - User: ${completion.user.email} (ID: ${completion.user.id})`);
    console.log(`    Completed at: ${completion.completedAt}`);
    console.log(`    Synced: ${completion.synced}`);
  }

  // Test with material that has no completions
  const [material2] = await db
    .insert(trainingMaterials)
    .values({
      title: 'Uncompleted Material',
      content: 'No one has completed this',
      categoryId: 'test-category',
    })
    .returning();

  const emptyCompletions = await getMaterialCompletions(material2.id);
  console.log(`\n✓ Material with no completions returns empty array: ${emptyCompletions.length === 0}`);

  if (emptyCompletions.length !== 0) {
    console.error(`✗ Expected 0 completions, got ${emptyCompletions.length}`);
    process.exit(1);
  }

  // Clean up
  console.log('\nCleaning up test data...');
  await db.delete(trainingMaterials).where(eq(trainingMaterials.id, material.id));
  await db.delete(trainingMaterials).where(eq(trainingMaterials.id, material2.id));
  await db.delete(users).where(eq(users.id, user1.id));
  await db.delete(users).where(eq(users.id, user2.id));
  await db.delete(users).where(eq(users.id, user3.id));
  console.log('✓ Test data cleaned up\n');

  console.log('✅ All tests passed!');
}

testMaterialCompletions().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
