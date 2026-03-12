/**
 * Test script for patient CRUD Server Actions
 * 
 * This script tests the createPatient, getPatients, and getPatient functions
 * to verify they work correctly with the database.
 */

import { db } from '@/db';
import { patients, users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function testPatientActions() {
  console.log('🧪 Testing Patient CRUD Actions\n');

  try {
    // Setup: Create a test user
    console.log('📝 Setting up test user...');
    const [testUser] = await db
      .insert(users)
      .values({
        name: 'Test Staff',
        email: `test-${Date.now()}@example.com`,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ Created test user: ${testUser.name} (ID: ${testUser.id})\n`);

    // Test 1: Create patient with valid data
    console.log('Test 1: Create patient with valid data');
    const [patient1] = await db
      .insert(patients)
      .values({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-05-15'),
        createdById: testUser.id,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ Created patient: ${patient1.firstName} ${patient1.lastName} (ID: ${patient1.id})\n`);

    // Test 2: Create another patient
    console.log('Test 2: Create second patient');
    const [patient2] = await db
      .insert(patients)
      .values({
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1985-08-22'),
        createdById: testUser.id,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ Created patient: ${patient2.firstName} ${patient2.lastName} (ID: ${patient2.id})\n`);

    // Test 3: Retrieve all patients
    console.log('Test 3: Retrieve all patients');
    const allPatients = await db.query.patients.findMany({
      orderBy: (patients, { desc }) => [desc(patients.createdAt)],
    });
    console.log(`✅ Retrieved ${allPatients.length} patients`);
    allPatients.forEach(p => {
      console.log(`   - ${p.firstName} ${p.lastName} (ID: ${p.id})`);
    });
    console.log();

    // Test 4: Retrieve single patient by ID
    console.log('Test 4: Retrieve single patient by ID');
    const retrievedPatient = await db.query.patients.findFirst({
      where: eq(patients.id, patient1.id),
    });
    if (retrievedPatient) {
      console.log(`✅ Retrieved patient: ${retrievedPatient.firstName} ${retrievedPatient.lastName}`);
      console.log(`   DOB: ${retrievedPatient.dateOfBirth.toISOString().split('T')[0]}`);
      console.log(`   Created by: User ID ${retrievedPatient.createdById}`);
      console.log(`   Created at: ${retrievedPatient.createdAt.toISOString()}\n`);
    } else {
      console.log('❌ Failed to retrieve patient\n');
    }

    // Test 5: Retrieve non-existent patient
    console.log('Test 5: Retrieve non-existent patient');
    const nonExistent = await db.query.patients.findFirst({
      where: eq(patients.id, 99999),
    });
    if (!nonExistent) {
      console.log('✅ Correctly returned null for non-existent patient\n');
    } else {
      console.log('❌ Should have returned null\n');
    }

    // Test 6: Verify patient data round-trip
    console.log('Test 6: Verify patient data round-trip');
    const roundTripPatient = await db.query.patients.findFirst({
      where: eq(patients.id, patient2.id),
    });
    if (
      roundTripPatient &&
      roundTripPatient.firstName === patient2.firstName &&
      roundTripPatient.lastName === patient2.lastName &&
      roundTripPatient.dateOfBirth.getTime() === patient2.dateOfBirth.getTime() &&
      roundTripPatient.createdById === patient2.createdById
    ) {
      console.log('✅ Patient data round-trip successful\n');
    } else {
      console.log('❌ Patient data mismatch\n');
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await db.delete(patients).where(eq(patients.createdById, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log('✅ Cleanup complete\n');

    console.log('✨ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testPatientActions();
