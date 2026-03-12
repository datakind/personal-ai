/**
 * Test script for assessment validation in Server Actions
 * Verifies that validation is correctly applied to PHQ-2 and PHQ-9 submissions
 */

import { db } from '@/db';
import { users, patients, assessments } from '@/db/schema';
import { submitPHQ2, submitPHQ9 } from '@/app/actions/assessments';

// Mock authentication
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn().mockResolvedValue({ id: 1, name: 'Test User', email: 'test@example.com' }),
  isUserPHQ9Qualified: jest.fn().mockResolvedValue(true),
}));

async function setupTestData() {
  // Create test user
  const [user] = await db.insert(users).values({
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
  }).returning();

  // Create test patient
  const [patient] = await db.insert(patients).values({
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    createdById: user.id,
    createdAt: new Date(),
  }).returning();

  return { user, patient };
}

async function testPHQ2Validation() {
  console.log('\n=== Testing PHQ-2 Validation ===\n');
  
  const { patient } = await setupTestData();

  // Test 1: Valid PHQ-2 responses
  console.log('Test 1: Valid PHQ-2 responses (0-6 range)');
  const validTests = [
    { responses: [0, 0], expectedScore: 0 },
    { responses: [1, 2], expectedScore: 3 },
    { responses: [3, 3], expectedScore: 6 },
  ];

  for (const test of validTests) {
    const result = await submitPHQ2(patient.id, test.responses);
    console.log(`  Responses ${JSON.stringify(test.responses)}: ${result.success ? '✓ PASS' : '✗ FAIL'}`);
    if (result.success && result.score !== test.expectedScore) {
      console.log(`    ✗ Score mismatch: expected ${test.expectedScore}, got ${result.score}`);
    }
  }

  // Test 2: Invalid array length
  console.log('\nTest 2: Invalid array length');
  const lengthTests = [
    { responses: [], description: 'Empty array' },
    { responses: [1], description: 'Too few (1 response)' },
    { responses: [1, 2, 3], description: 'Too many (3 responses)' },
  ];

  for (const test of lengthTests) {
    const result = await submitPHQ2(patient.id, test.responses);
    console.log(`  ${test.description}: ${!result.success ? '✓ PASS (rejected)' : '✗ FAIL (accepted)'}`);
    if (!result.success) {
      console.log(`    Error: ${result.error}`);
    }
  }

  // Test 3: Invalid response values
  console.log('\nTest 3: Invalid response values');
  const valueTests = [
    { responses: [-1, 2], description: 'Negative value' },
    { responses: [1, 4], description: 'Value > 3' },
    { responses: [1.5, 2], description: 'Non-integer (float)' },
  ];

  for (const test of valueTests) {
    const result = await submitPHQ2(patient.id, test.responses);
    console.log(`  ${test.description}: ${!result.success ? '✓ PASS (rejected)' : '✗ FAIL (accepted)'}`);
    if (!result.success) {
      console.log(`    Error: ${result.error}`);
    }
  }

  // Test 4: Score range validation
  console.log('\nTest 4: Score range validation (0-6)');
  const allValidScores = [
    [0, 0], [0, 1], [0, 2], [0, 3],
    [1, 0], [1, 1], [1, 2], [1, 3],
    [2, 0], [2, 1], [2, 2], [2, 3],
    [3, 0], [3, 1], [3, 2], [3, 3],
  ];
  
  let allScoresValid = true;
  for (const responses of allValidScores) {
    const result = await submitPHQ2(patient.id, responses);
    const expectedScore = responses[0] + responses[1];
    if (!result.success || result.score !== expectedScore) {
      console.log(`  ✗ FAIL for ${JSON.stringify(responses)}: expected score ${expectedScore}`);
      allScoresValid = false;
    }
  }
  if (allScoresValid) {
    console.log('  ✓ PASS: All valid score combinations (0-6) accepted');
  }
}

async function testPHQ9Validation() {
  console.log('\n=== Testing PHQ-9 Validation ===\n');
  
  const { patient } = await setupTestData();

  // Test 1: Valid PHQ-9 responses
  console.log('Test 1: Valid PHQ-9 responses (0-27 range)');
  const validTests = [
    { responses: [0, 0, 0, 0, 0, 0, 0, 0, 0], expectedScore: 0 },
    { responses: [1, 1, 1, 1, 1, 1, 1, 1, 1], expectedScore: 9 },
    { responses: [3, 3, 3, 3, 3, 3, 3, 3, 3], expectedScore: 27 },
    { responses: [0, 1, 2, 3, 0, 1, 2, 3, 1], expectedScore: 13 },
  ];

  for (const test of validTests) {
    const result = await submitPHQ9(patient.id, test.responses);
    console.log(`  Score ${test.expectedScore}: ${result.success ? '✓ PASS' : '✗ FAIL'}`);
    if (result.success && result.score !== test.expectedScore) {
      console.log(`    ✗ Score mismatch: expected ${test.expectedScore}, got ${result.score}`);
    }
  }

  // Test 2: Invalid array length
  console.log('\nTest 2: Invalid array length');
  const lengthTests = [
    { responses: [], description: 'Empty array' },
    { responses: [1, 2, 3], description: 'Too few (3 responses)' },
    { responses: [1, 2, 3, 0, 1, 2, 3, 0, 1, 2], description: 'Too many (10 responses)' },
  ];

  for (const test of lengthTests) {
    const result = await submitPHQ9(patient.id, test.responses);
    console.log(`  ${test.description}: ${!result.success ? '✓ PASS (rejected)' : '✗ FAIL (accepted)'}`);
    if (!result.success) {
      console.log(`    Error: ${result.error}`);
    }
  }

  // Test 3: Invalid response values
  console.log('\nTest 3: Invalid response values');
  const valueTests = [
    { responses: [-1, 0, 0, 0, 0, 0, 0, 0, 0], description: 'Negative value' },
    { responses: [0, 0, 0, 0, 5, 0, 0, 0, 0], description: 'Value > 3' },
    { responses: [0, 0, 0, 0, 0, 0, 0, 0, 2.5], description: 'Non-integer (float)' },
  ];

  for (const test of valueTests) {
    const result = await submitPHQ9(patient.id, test.responses);
    console.log(`  ${test.description}: ${!result.success ? '✓ PASS (rejected)' : '✗ FAIL (accepted)'}`);
    if (!result.success) {
      console.log(`    Error: ${result.error}`);
    }
  }

  // Test 4: Score range validation (0-27)
  console.log('\nTest 4: Score range validation (0-27)');
  const boundaryTests = [
    { responses: [0, 0, 0, 0, 0, 0, 0, 0, 0], expectedScore: 0, description: 'Minimum score' },
    { responses: [3, 3, 3, 3, 3, 3, 3, 3, 3], expectedScore: 27, description: 'Maximum score' },
  ];

  for (const test of boundaryTests) {
    const result = await submitPHQ9(patient.id, test.responses);
    console.log(`  ${test.description}: ${result.success ? '✓ PASS' : '✗ FAIL'}`);
    if (result.success && result.score !== test.expectedScore) {
      console.log(`    ✗ Score mismatch: expected ${test.expectedScore}, got ${result.score}`);
    }
  }
}

async function main() {
  try {
    await testPHQ2Validation();
    await testPHQ9Validation();
    
    console.log('\n=== All Validation Tests Complete ===\n');
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

main();
