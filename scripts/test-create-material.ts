import { createTrainingMaterial } from '@/lib/training';

async function testCreateMaterial() {
  console.log('Testing createTrainingMaterial function...\n');

  // Test 1: Valid material creation
  console.log('Test 1: Creating valid training material');
  const result1 = await createTrainingMaterial(
    'Introduction to TypeScript',
    'Learn the basics of TypeScript including types, interfaces, and more.',
    'programming'
  );
  
  if (result1.success) {
    console.log('✓ Material created successfully');
    console.log('  ID:', result1.material.id);
    console.log('  Title:', result1.material.title);
    console.log('  Category:', result1.material.categoryId);
    console.log('  Created at:', result1.material.createdAt);
  } else {
    console.log('✗ Failed:', result1.error);
  }

  // Test 2: Empty title
  console.log('\nTest 2: Creating material with empty title');
  const result2 = await createTrainingMaterial(
    '',
    'Some content',
    'category'
  );
  
  if (!result2.success) {
    console.log('✓ Validation error caught:', result2.error);
  } else {
    console.log('✗ Should have failed validation');
  }

  // Test 3: Empty content
  console.log('\nTest 3: Creating material with empty content');
  const result3 = await createTrainingMaterial(
    'Valid Title',
    '',
    'category'
  );
  
  if (!result3.success) {
    console.log('✓ Validation error caught:', result3.error);
  } else {
    console.log('✗ Should have failed validation');
  }

  // Test 4: Empty categoryId
  console.log('\nTest 4: Creating material with empty categoryId');
  const result4 = await createTrainingMaterial(
    'Valid Title',
    'Valid content',
    ''
  );
  
  if (!result4.success) {
    console.log('✓ Validation error caught:', result4.error);
  } else {
    console.log('✗ Should have failed validation');
  }

  // Test 5: Whitespace-only strings
  console.log('\nTest 5: Creating material with whitespace-only title');
  const result5 = await createTrainingMaterial(
    '   ',
    'Valid content',
    'category'
  );
  
  if (!result5.success) {
    console.log('✓ Validation error caught:', result5.error);
  } else {
    console.log('✗ Should have failed validation');
  }

  console.log('\nAll tests completed!');
}

testCreateMaterial().catch(console.error);
