import { db } from '@/db';
import { users, trainingMaterials, trainingCompletions } from '@/db/schema';
import { getUnsyncedCompletions } from '@/lib/training';

async function testUnsyncedCompletions() {
  console.log('Testing getUnsyncedCompletions function...\n');

  try {
    // Create a test user
    const [testUser] = await db
      .insert(users)
      .values({ email: `test-unsynced-${Date.now()}@example.com` })
      .returning();
    console.log(`✓ Created test user: ${testUser.email} (ID: ${testUser.id})`);

    // Create test materials
    const [material1] = await db
      .insert(trainingMaterials)
      .values({
        title: 'Test Material 1',
        content: 'Content 1',
        categoryId: 'test-category',
      })
      .returning();

    const [material2] = await db
      .insert(trainingMaterials)
      .values({
        title: 'Test Material 2',
        content: 'Content 2',
        categoryId: 'test-category',
      })
      .returning();
    console.log(`✓ Created test materials (IDs: ${material1.id}, ${material2.id})`);

    // Create completions: one synced, one unsynced
    await db.insert(trainingCompletions).values({
      userId: testUser.id,
      materialId: material1.id,
      synced: false, // Unsynced
    });

    await db.insert(trainingCompletions).values({
      userId: testUser.id,
      materialId: material2.id,
      synced: true, // Synced
    });
    console.log('✓ Created test completions (1 synced, 1 unsynced)\n');

    // Test the function
    const unsyncedCompletions = await getUnsyncedCompletions(testUser.id);

    console.log('Results:');
    console.log(`- Found ${unsyncedCompletions.length} unsynced completion(s)`);
    
    if (unsyncedCompletions.length === 1) {
      const completion = unsyncedCompletions[0];
      console.log(`- Completion ID: ${completion.id}`);
      console.log(`- User ID: ${completion.userId}`);
      console.log(`- Material ID: ${completion.materialId}`);
      console.log(`- Synced: ${completion.synced}`);
      console.log(`- Material Title: ${completion.material.title}`);
      console.log(`- Material Content: ${completion.material.content}`);
      console.log('\n✓ Test passed: Function returned exactly 1 unsynced completion with material details');
    } else {
      console.log('\n✗ Test failed: Expected 1 unsynced completion');
      process.exit(1);
    }

    // Cleanup (cascade delete will handle completions)
    await db.delete(users);
    await db.delete(trainingMaterials);
    console.log('✓ Cleanup completed');

  } catch (error) {
    console.error('✗ Test failed with error:', error);
    process.exit(1);
  }
}

testUnsyncedCompletions();
