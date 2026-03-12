/**
 * Verification Script: Authentication Implementation in Server Actions
 * 
 * This script verifies that all Server Actions properly implement authentication
 * by checking that requireAuth() is called at the start of each action.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const SERVER_ACTION_FILES = [
  'app/actions/patients.ts',
  'app/actions/assessments.ts',
];

const EXPECTED_AUTHENTICATED_ACTIONS = [
  'createPatient',
  'getPatients',
  'getPatient',
  'submitPHQ2',
  'submitPHQ9',
  'getAssessmentHistory',
];

console.log('🔍 Verifying authentication implementation in Server Actions...\n');

let allPassed = true;

for (const file of SERVER_ACTION_FILES) {
  const filePath = join(process.cwd(), file);
  const content = readFileSync(filePath, 'utf-8');
  
  console.log(`📄 Checking ${file}...`);
  
  // Check that requireAuth is imported
  if (!content.includes("import { requireAuth")) {
    console.log(`  ❌ Missing requireAuth import`);
    allPassed = false;
  } else {
    console.log(`  ✅ requireAuth imported`);
  }
  
  // Extract all exported async functions
  const functionRegex = /export async function (\w+)/g;
  const functions = [...content.matchAll(functionRegex)].map(match => match[1]);
  
  console.log(`  Found ${functions.length} Server Actions: ${functions.join(', ')}`);
  
  // Check each function that should have authentication
  for (const funcName of functions) {
    if (EXPECTED_AUTHENTICATED_ACTIONS.includes(funcName)) {
      // Find the function body
      const funcStart = content.indexOf(`export async function ${funcName}`);
      const funcBody = content.substring(funcStart, funcStart + 1000); // Get first 1000 chars
      
      // Check if requireAuth() is called
      if (funcBody.includes('await requireAuth()') || funcBody.includes('const user = await requireAuth()')) {
        console.log(`  ✅ ${funcName}: Authentication implemented`);
      } else {
        console.log(`  ❌ ${funcName}: Missing requireAuth() call`);
        allPassed = false;
      }
      
      // Check if authentication errors are handled
      if (funcBody.includes("'Authentication required'")) {
        console.log(`  ✅ ${funcName}: Authentication error handling present`);
      } else {
        console.log(`  ⚠️  ${funcName}: Missing authentication error handling`);
      }
    }
  }
  
  console.log('');
}

// Summary
console.log('═'.repeat(60));
if (allPassed) {
  console.log('✅ All Server Actions properly implement authentication!');
  process.exit(0);
} else {
  console.log('❌ Some Server Actions are missing authentication implementation');
  process.exit(1);
}
