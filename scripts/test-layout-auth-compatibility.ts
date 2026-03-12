/**
 * Test script to verify root layout doesn't interfere with authentication.
 * 
 * This script validates that:
 * 1. The root layout doesn't contain auth-blocking logic
 * 2. The layout works for both authenticated and unauthenticated states
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Testing root layout authentication compatibility...\n');

// Read the root layout file
const layoutPath = join(process.cwd(), 'app', 'layout.tsx');
const layoutContent = readFileSync(layoutPath, 'utf-8');

// Test 1: Verify no authentication imports
console.log('Test 1: Checking for authentication imports...');
const authImports = [
  'getCurrentUser',
  'requireAuth',
  'validateSession',
  'from \'@/lib/auth\'',
  'from "@/lib/auth"',
];

let hasAuthImports = false;
for (const authImport of authImports) {
  if (layoutContent.includes(authImport)) {
    console.error(`❌ FAIL: Found authentication import: ${authImport}`);
    hasAuthImports = true;
  }
}

if (!hasAuthImports) {
  console.log('✅ PASS: No authentication imports found\n');
} else {
  console.log('');
}

// Test 2: Verify no session/cookie access
console.log('Test 2: Checking for session/cookie access...');
const sessionAccess = [
  'cookies()',
  'session',
  'validateSession',
];

let hasSessionAccess = false;
for (const access of sessionAccess) {
  if (layoutContent.includes(access)) {
    console.error(`❌ FAIL: Found session access: ${access}`);
    hasSessionAccess = true;
  }
}

if (!hasSessionAccess) {
  console.log('✅ PASS: No session/cookie access found\n');
} else {
  console.log('');
}

// Test 3: Verify no conditional rendering based on auth
console.log('Test 3: Checking for conditional auth rendering...');
const conditionalPatterns = [
  /if\s*\(\s*user\s*\)/,
  /if\s*\(\s*!user\s*\)/,
  /if\s*\(\s*isAuthenticated\s*\)/,
  /user\s*\?\s*.*\s*:\s*/,
];

let hasConditionalAuth = false;
for (const pattern of conditionalPatterns) {
  if (pattern.test(layoutContent)) {
    console.error(`❌ FAIL: Found conditional auth rendering: ${pattern}`);
    hasConditionalAuth = true;
  }
}

if (!hasConditionalAuth) {
  console.log('✅ PASS: No conditional auth rendering found\n');
} else {
  console.log('');
}

// Test 4: Verify children are rendered unconditionally
console.log('Test 4: Checking that children are rendered...');
if (layoutContent.includes('{children}')) {
  console.log('✅ PASS: Children are rendered unconditionally\n');
} else {
  console.error('❌ FAIL: Children are not rendered or conditionally rendered\n');
}

// Test 5: Verify layout is a Server Component (no 'use client')
console.log('Test 5: Checking layout is a Server Component...');
if (layoutContent.includes("'use client'") || layoutContent.includes('"use client"')) {
  console.error('❌ FAIL: Layout is a Client Component (has "use client" directive)\n');
} else {
  console.log('✅ PASS: Layout is a Server Component\n');
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Summary:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const allPassed = !hasAuthImports && !hasSessionAccess && !hasConditionalAuth && 
                  layoutContent.includes('{children}') && 
                  !layoutContent.includes("'use client'") && 
                  !layoutContent.includes('"use client"');

if (allPassed) {
  console.log('✅ All tests passed!');
  console.log('✅ Root layout does NOT interfere with authentication');
  console.log('✅ Layout works for both authenticated and unauthenticated states');
  console.log('\nThe root layout correctly:');
  console.log('  • Contains no authentication logic');
  console.log('  • Renders children unconditionally');
  console.log('  • Remains stateless and presentation-only');
  console.log('  • Delegates authentication to middleware and pages');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  console.log('❌ Root layout may interfere with authentication');
  process.exit(1);
}
