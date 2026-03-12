/**
 * Example Property-Based Tests for Training Materials Tracking
 * 
 * This file demonstrates how to use the test helpers and fast-check generators
 * for property-based testing. It includes a simple example property test.
 * 
 * To run this test: tsx tests/training-properties-example.test.ts
 */

import fc from 'fast-check';
import {
  createTestContext,
  userIdArb,
  materialIdArb,
  trainingMaterialArb,
  verifyTimestampRecent,
} from './training-test-helpers';
import { recordTrainingCompletion } from '@/lib/training';

// Color codes for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

/**
 * Example Property Test: Completion Record Creation
 * 
 * **Validates: Requirements 2.1**
 * 
 * Property: For any valid user ID and material ID, when a completion is created,
 * the system should successfully store a completion record that can be retrieved
 * with matching user ID, material ID, and a completion timestamp.
 */
async function testCompletionRecordCreation() {
  log('\n=== Example Property Test: Completion Record Creation ===', YELLOW);
  
  const ctx = await createTestContext();
  
  try {
    // Create test user and material
    const user = await ctx.createUser();
    const material = await ctx.createMaterial({
      title: 'Example Training Material',
      content: 'Example content for property testing',
      categoryId: 'example-category',
    });
    
    log(`Created test user (ID: ${user.id}) and material (ID: ${material.id})`);
    
    // Test the property: completion can be created and retrieved
    const result = await recordTrainingCompletion(user.id, material.id);
    
    if (!result.success) {
      log(`✗ Failed to create completion: ${result.error}`, RED);
      return false;
    }
    
    const completion = result.completion;
    
    // Verify the completion has correct properties
    const userIdMatches = completion.userId === user.id;
    const materialIdMatches = completion.materialId === material.id;
    const timestampRecent = verifyTimestampRecent(completion.completedAt);
    const syncedIsFalse = completion.synced === false;
    
    log(`  User ID matches: ${userIdMatches ? '✓' : '✗'}`, userIdMatches ? GREEN : RED);
    log(`  Material ID matches: ${materialIdMatches ? '✓' : '✗'}`, materialIdMatches ? GREEN : RED);
    log(`  Timestamp is recent: ${timestampRecent ? '✓' : '✗'}`, timestampRecent ? GREEN : RED);
    log(`  Synced is false: ${syncedIsFalse ? '✓' : '✗'}`, syncedIsFalse ? GREEN : RED);
    
    const allChecksPass = userIdMatches && materialIdMatches && timestampRecent && syncedIsFalse;
    
    if (allChecksPass) {
      log('✓ Property test passed: Completion record created successfully', GREEN);
    } else {
      log('✗ Property test failed: Some checks did not pass', RED);
    }
    
    return allChecksPass;
    
  } catch (error) {
    log(`✗ Property test error: ${error}`, RED);
    return false;
  } finally {
    await ctx.cleanup();
    log('Test cleanup completed');
  }
}

/**
 * Example of using fast-check for property-based testing
 * 
 * This demonstrates how to use the custom generators with fast-check
 * to test properties across many random inputs.
 */
async function demonstrateFastCheckUsage() {
  log('\n=== Demonstrating fast-check Generator Usage ===', YELLOW);
  
  // Generate 5 random training material objects
  log('\nGenerating 5 random training materials:');
  
  for (let i = 0; i < 5; i++) {
    const material = fc.sample(trainingMaterialArb, 1)[0];
    log(`  ${i + 1}. Title: "${material.title.substring(0, 30)}..."`, GREEN);
    log(`     Category: "${material.categoryId}"`, GREEN);
    log(`     Content length: ${material.content.length} chars`, GREEN);
  }
  
  // Generate 5 random user IDs
  log('\nGenerating 5 random user IDs:');
  const userIds = fc.sample(userIdArb, 5);
  userIds.forEach((id, i) => {
    log(`  ${i + 1}. User ID: ${id}`, GREEN);
  });
  
  // Generate 5 random material IDs
  log('\nGenerating 5 random material IDs:');
  const materialIds = fc.sample(materialIdArb, 5);
  materialIds.forEach((id, i) => {
    log(`  ${i + 1}. Material ID: ${id}`, GREEN);
  });
}

/**
 * Main test runner
 */
async function runTests() {
  log('='.repeat(60), YELLOW);
  log('Property-Based Testing Example for Training Materials', YELLOW);
  log('='.repeat(60), YELLOW);
  
  try {
    // Demonstrate fast-check generator usage
    await demonstrateFastCheckUsage();
    
    // Run example property test
    const testPassed = await testCompletionRecordCreation();
    
    log('\n' + '='.repeat(60), YELLOW);
    if (testPassed) {
      log('✓ All example tests passed!', GREEN);
      log('\nNext steps:', YELLOW);
      log('1. Review tests/training-test-helpers.ts for available generators and helpers');
      log('2. Implement property tests for all 13 correctness properties');
      log('3. Use fc.assert() with fc.property() for comprehensive property testing');
      process.exit(0);
    } else {
      log('✗ Some tests failed', RED);
      process.exit(1);
    }
  } catch (error) {
    log(`\nFatal error: ${error}`, RED);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
runTests();
