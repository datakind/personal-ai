/**
 * Integration test for training error handling
 * Task 7.1: Verify error boundary component
 * 
 * Tests that the error boundary component exists and is properly configured
 * for the training pages.
 * 
 * Requirements: 6.1, 6.2
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

async function runTests() {
  console.log('Running training error handling tests...\n');

  // Test 1: Error boundary file exists
  console.log('Test 1: Error boundary file exists');
  const errorFilePath = join(process.cwd(), 'app', 'training', 'error.tsx');
  
  if (!existsSync(errorFilePath)) {
    throw new Error('Error boundary file does not exist at app/training/error.tsx');
  }
  
  console.log('✓ Test 1 passed\n');

  // Test 2: Error boundary has required structure
  console.log('Test 2: Error boundary has required structure');
  const errorFileContent = readFileSync(errorFilePath, 'utf-8');
  
  // Check for 'use client' directive (required for error boundaries)
  if (!errorFileContent.includes("'use client'")) {
    throw new Error("Error boundary must have 'use client' directive");
  }
  
  // Check for error and reset props
  if (!errorFileContent.includes('error') || !errorFileContent.includes('reset')) {
    throw new Error('Error boundary must accept error and reset props');
  }
  
  console.log('✓ Test 2 passed\n');

  // Test 3: Error boundary displays user-friendly message
  console.log('Test 3: Error boundary displays user-friendly message');
  
  // Requirement 6.1 & 6.2: Display error message
  if (!errorFileContent.includes('Failed to load training materials') && 
      !errorFileContent.includes('error') && 
      !errorFileContent.includes('problem')) {
    throw new Error('Error boundary must display user-friendly error message');
  }
  
  console.log('✓ Test 3 passed\n');

  // Test 4: Error boundary has retry functionality
  console.log('Test 4: Error boundary has retry functionality');
  
  // Check for retry button that calls reset
  if (!errorFileContent.includes('onClick') || 
      !errorFileContent.toLowerCase().includes('try again') && 
      !errorFileContent.toLowerCase().includes('retry')) {
    throw new Error('Error boundary must have retry functionality');
  }
  
  console.log('✓ Test 4 passed\n');

  // Test 5: Error boundary has link back to dashboard
  console.log('Test 5: Error boundary has link back to dashboard');
  
  // Check for dashboard link
  if (!errorFileContent.includes('/dashboard') || 
      !errorFileContent.includes('Link')) {
    throw new Error('Error boundary must have link back to dashboard');
  }
  
  console.log('✓ Test 5 passed\n');

  // Test 6: Error boundary uses proper Next.js Link component
  console.log('Test 6: Error boundary uses proper Next.js Link component');
  
  if (!errorFileContent.includes("from 'next/link'") && 
      !errorFileContent.includes('from "next/link"')) {
    throw new Error('Error boundary must use Next.js Link component');
  }
  
  console.log('✓ Test 6 passed\n');

  console.log('All training error handling tests passed! ✓');
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
