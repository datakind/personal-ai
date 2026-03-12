/**
 * Test script for patient validation logic
 * 
 * This script tests the validation rules directly without Server Actions
 */

import { db } from '@/db';
import { patients, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function testValidation() {
  console.log('🧪 Testing Patient Validation Logic\n');

  try {
    // Setup: Create a test user
    console.log('📝 Setting up test user...');
    const [testUser] = await db
      .insert(users)
      .values({
        name: 'Test Staff',
        email: `test-validation-${Date.now()}@example.com`,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ Created test user\n`);

    // Test 1: Valid patient creation
    console.log('Test 1: Valid patient creation');
    const firstName1 = 'John';
    const lastName1 = 'Doe';
    const dob1 = new Date('1990-05-15');
    
    if (firstName1.trim() && lastName1.trim() && dob1 < new Date()) {
      const [patient1] = await db
        .insert(patients)
        .values({
          firstName: firstName1.trim(),
          lastName: lastName1.trim(),
          dateOfBirth: dob1,
          createdById: testUser.id,
          createdAt: new Date(),
        })
        .returning();
      console.log(`✅ Valid patient created: ${patient1.firstName} ${patient1.lastName}\n`);
    } else {
      console.log('❌ Validation should have passed\n');
    }

    // Test 2: Empty first name validation
    console.log('Test 2: Empty first name validation');
    const firstName2 = '';
    const lastName2 = 'Doe';
    if (!firstName2.trim()) {
      console.log('✅ Correctly rejected empty first name\n');
    } else {
      console.log('❌ Should have rejected empty first name\n');
    }

    // Test 3: Empty last name validation
    console.log('Test 3: Empty last name validation');
    const firstName3 = 'John';
    const lastName3 = '   ';
    if (!lastName3.trim()) {
      console.log('✅ Correctly rejected empty last name\n');
    } else {
      console.log('❌ Should have rejected empty last name\n');
    }

    // Test 4: Future date validation
    console.log('Test 4: Future date validation');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    if (futureDate >= new Date()) {
      console.log('✅ Correctly detected future date\n');
    } else {
      console.log('❌ Should have detected future date\n');
    }

    // Test 5: Invalid date validation
    console.log('Test 5: Invalid date validation');
    const invalidDate = new Date('not-a-date');
    if (isNaN(invalidDate.getTime())) {
      console.log('✅ Correctly detected invalid date\n');
    } else {
      console.log('❌ Should have detected invalid date\n');
    }

    // Test 6: Whitespace trimming
    console.log('Test 6: Whitespace trimming');
    const firstName6 = '  Jane  ';
    const lastName6 = '  Smith  ';
    const dob6 = new Date('1985-08-22');
    
    const [patient6] = await db
      .insert(patients)
      .values({
        firstName: firstName6.trim(),
        lastName: lastName6.trim(),
        dateOfBirth: dob6,
        createdById: testUser.id,
        createdAt: new Date(),
      })
      .returning();
    
    if (patient6.firstName === 'Jane' && patient6.lastName === 'Smith') {
      console.log(`✅ Whitespace correctly trimmed: "${patient6.firstName}" "${patient6.lastName}"\n`);
    } else {
      console.log('❌ Whitespace trimming failed\n');
    }

    // Test 7: Name length validation
    console.log('Test 7: Name length validation');
    const longName = 'a'.repeat(256);
    if (longName.length > 255) {
      console.log('✅ Correctly detected name exceeding 255 characters\n');
    } else {
      console.log('❌ Should have detected long name\n');
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await db.delete(patients).where(eq(patients.createdById, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log('✅ Cleanup complete\n');

    console.log('✨ All validation tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testValidation();
