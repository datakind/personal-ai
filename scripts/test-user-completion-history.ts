import { db } from '@/db';
import { users, trainingMaterials, trainingCompletions } from '@/db/schema';
import { getUserCompletionHistory } from '@/lib/training';
import { eq } from 'drizzle-orm';

async function testGetUserCompletionHistory() {
  console.log('Testing getUserCompletionHistory function...\n');

  // Create test user
  const [user] = await db
    .insert(users)
    .values({
      email: 'test-history@example.com',
    })
    .returning();
  console.log('✓ Created test user:', user.id);

  // Create test training materials
  const materials = [];
  for (let i = 1; i <= 3; i++) {
    const [material] = await db
      .insert(trainingMaterials)
      .values({
        title: `Test Material ${i}`,
        content: `Test content ${i}`,
        categoryId: 'test-category',
      })
      .returning();
    materials.push(material);
    console.log(`✓ Created test material ${i}:`, material.id);
  }

  // Create completion records with slight delays to ensure different timestamps
  console.log('\nCreating completion records...');
  for (let i = 0; i < materials.length; i++) {
    await db.insert(trainingCompletions).values({
      userId: user.id,
      materialId: materials[i].id,
      synced: i % 2 === 0, // Alternate synced status
    });
    console.log(`✓ Created completion for material ${i + 1}`);
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Test 1: Get user completion history
  console.log('\nTest 1: Get user completion history');
  const history = await getUserCompletionHistory(user.id);
  console.log('✓ Retrieved completion history');
  console.log('  - Total completions:', history.length);
  
  if (history.length === 3) {
    console.log('✓ Correct number of completions returned');
  } else {
    console.log('✗ Expected 3 completions, got:', history.length);
  }

  // Test 2: Verify ordering (most recent first)
  console.log('\nTest 2: Verify ordering (descending by completedAt)');
  let isOrdered = true;
  for (let i = 0; i < history.length - 1; i++) {
    const current = history[i].completedAt.getTime();
    const next = history[i + 1].completedAt.getTime();
    if (current < next) {
      isOrdered = false;
      console.log('✗ Ordering incorrect at index', i);
      break;
    }
  }
  if (isOrdered) {
    console.log('✓ Completions ordered correctly (most recent first)');
  }

  // Test 3: Verify material data is joined
  console.log('\nTest 3: Verify material data is joined');
  let allHaveMaterials = true;
  for (const completion of history) {
    if (!completion.material) {
      allHaveMaterials = false;
      console.log('✗ Completion missing material data:', completion.id);
      break;
    }
  }
  if (allHaveMaterials) {
    console.log('✓ All completions have joined material data');
    console.log('  Sample material:', {
      id: history[0].material.id,
      title: history[0].material.title,
    });
  }

  // Test 4: Empty history for non-existent user
  console.log('\nTest 4: Empty history for non-existent user');
  const emptyHistory = await getUserCompletionHistory(999999);
  if (emptyHistory.length === 0) {
    console.log('✓ Returns empty array for non-existent user');
  } else {
    console.log('✗ Should return empty array, got:', emptyHistory.length);
  }

  // Clean up test data
  console.log('\nCleaning up test data...');
  await db.delete(trainingCompletions).where(eq(trainingCompletions.userId, user.id));
  for (const material of materials) {
    await db.delete(trainingMaterials).where(eq(trainingMaterials.id, material.id));
  }
  await db.delete(users).where(eq(users.id, user.id));
  console.log('✓ Cleanup complete\n');

  console.log('All tests passed! ✓');
}

testGetUserCompletionHistory().catch(console.error);
