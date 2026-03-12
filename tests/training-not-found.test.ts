/**
 * Unit test for training detail not-found page
 * Task 7.3: Create not found component
 * 
 * Tests the not-found component:
 * - Displays user-friendly 404 message
 * - Includes link back to training list
 * 
 * Requirements: 2.4
 */

import { readFileSync } from 'fs';
import { join } from 'path';

async function runTests() {
  console.log('Running training not-found component tests...\n');

  // Test 1: Component file exists
  console.log('Test 1: Component file exists');
  try {
    const componentPath = join(process.cwd(), 'app/training/[id]/not-found.tsx');
    const content = readFileSync(componentPath, 'utf-8');

    if (!content) {
      throw new Error('Component file is empty');
    }

    console.log('✓ Test 1 passed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
    throw error;
  }

  // Test 2: Component contains user-friendly 404 message
  console.log('Test 2: Component contains user-friendly 404 message');
  try {
    const componentPath = join(process.cwd(), 'app/training/[id]/not-found.tsx');
    const content = readFileSync(componentPath, 'utf-8');

    if (!content.includes('Training Material Not Found')) {
      throw new Error('Component does not contain "Training Material Not Found" heading');
    }

    if (!content.includes("doesn't exist") || !content.includes('removed')) {
      throw new Error('Component does not contain user-friendly explanation message');
    }

    console.log('✓ Test 2 passed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
    throw error;
  }

  // Test 3: Component includes link back to training list
  console.log('Test 3: Component includes link back to training list');
  try {
    const componentPath = join(process.cwd(), 'app/training/[id]/not-found.tsx');
    const content = readFileSync(componentPath, 'utf-8');

    if (!content.includes('href="/training"')) {
      throw new Error('Component does not contain link to /training');
    }

    if (!content.includes('Back to Training List')) {
      throw new Error('Component does not contain "Back to Training List" link text');
    }

    console.log('✓ Test 3 passed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
    throw error;
  }

  // Test 4: Component references Requirements 2.4
  console.log('Test 4: Component references Requirements 2.4');
  try {
    const componentPath = join(process.cwd(), 'app/training/[id]/not-found.tsx');
    const content = readFileSync(componentPath, 'utf-8');

    if (!content.includes('Requirements: 2.4') && !content.includes('Requirement 2.4')) {
      throw new Error('Component does not reference Requirements 2.4 in comments');
    }

    console.log('✓ Test 4 passed\n');
  } catch (error) {
    console.error('✗ Test 4 failed:', error);
    throw error;
  }

  // Test 5: Component exports default function
  console.log('Test 5: Component exports default function');
  try {
    const componentPath = join(process.cwd(), 'app/training/[id]/not-found.tsx');
    const content = readFileSync(componentPath, 'utf-8');

    if (!content.includes('export default function')) {
      throw new Error('Component does not export a default function');
    }

    console.log('✓ Test 5 passed\n');
  } catch (error) {
    console.error('✗ Test 5 failed:', error);
    throw error;
  }

  console.log('All training not-found component tests passed! ✓');
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
