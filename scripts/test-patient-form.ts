/**
 * Test script for patient form functionality
 * Tests the createPatient Server Action with various inputs
 */

import { createPatient } from '@/app/actions/patients';

async function testPatientForm() {
  console.log('Testing Patient Form Functionality\n');

  // Test 1: Valid patient creation
  console.log('Test 1: Creating valid patient...');
  const formData1 = new FormData();
  formData1.append('firstName', 'John');
  formData1.append('lastName', 'Doe');
  formData1.append('dateOfBirth', '1990-05-15');

  const result1 = await createPatient(formData1);
  console.log('Result:', result1);
  console.log(result1.success ? '✓ PASS' : '✗ FAIL');
  console.log();

  // Test 2: Empty first name
  console.log('Test 2: Empty first name validation...');
  const formData2 = new FormData();
  formData2.append('firstName', '');
  formData2.append('lastName', 'Smith');
  formData2.append('dateOfBirth', '1985-03-20');

  const result2 = await createPatient(formData2);
  console.log('Result:', result2);
  console.log(!result2.success && result2.error?.includes('First name') ? '✓ PASS' : '✗ FAIL');
  console.log();

  // Test 3: Empty last name
  console.log('Test 3: Empty last name validation...');
  const formData3 = new FormData();
  formData3.append('firstName', 'Jane');
  formData3.append('lastName', '   ');
  formData3.append('dateOfBirth', '1992-08-10');

  const result3 = await createPatient(formData3);
  console.log('Result:', result3);
  console.log(!result3.success && result3.error?.includes('Last name') ? '✓ PASS' : '✗ FAIL');
  console.log();

  // Test 4: Future date of birth
  console.log('Test 4: Future date of birth validation...');
  const formData4 = new FormData();
  formData4.append('firstName', 'Future');
  formData4.append('lastName', 'Person');
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  formData4.append('dateOfBirth', futureDate.toISOString().split('T')[0]);

  const result4 = await createPatient(formData4);
  console.log('Result:', result4);
  console.log(!result4.success && result4.error?.includes('past') ? '✓ PASS' : '✗ FAIL');
  console.log();

  // Test 5: Invalid date format
  console.log('Test 5: Invalid date format validation...');
  const formData5 = new FormData();
  formData5.append('firstName', 'Test');
  formData5.append('lastName', 'User');
  formData5.append('dateOfBirth', 'invalid-date');

  const result5 = await createPatient(formData5);
  console.log('Result:', result5);
  console.log(!result5.success && result5.error?.includes('valid date') ? '✓ PASS' : '✗ FAIL');
  console.log();

  console.log('All tests completed!');
}

testPatientForm().catch(console.error);
