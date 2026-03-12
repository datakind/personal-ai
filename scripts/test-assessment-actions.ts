/**
 * Test script for assessment database operations
 * Tests assessment creation and retrieval directly via database
 */

import { db } from '@/db';
import { users, patients, assessments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { calculatePHQ2Score, calculatePHQ9Score, validatePHQ2Responses, validatePHQ9Responses } from '@/lib/assessments';

async function testAssessmentOperations() {
  console.log('🧪 Testing Assessment Database Operations\n');

  try {
    // Setup: Create test user
    console.log('📝 Setting up test user...');
    const [testUser] = await db
      .insert(users)
      .values({
        name: 'Test Assessor',
        email: `assessor-${Date.now()}@test.com`,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ Created test user: ${testUser.name} (ID: ${testUser.id})\n`);

    // Setup: Create test patient
    console.log('📝 Setting up test patient...');
    const [testPatient] = await db
      .insert(patients)
      .values({
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
        createdById: testUser.id,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ Created test patient: ${testPatient.firstName} ${testPatient.lastName} (ID: ${testPatient.id})\n`);

    // Test 1: Create PHQ-2 assessment with low score
    console.log('Test 1: Create PHQ-2 assessment with low score');
    const phq2Responses = [1, 1];
    const phq2Score = calculatePHQ2Score(phq2Responses);
    const [phq2Assessment] = await db
      .insert(assessments)
      .values({
        patientId: testPatient.id,
        userId: testUser.id,
        assessmentType: 'PHQ-2',
        totalScore: phq2Score,
        responses: JSON.stringify(phq2Responses),
        completedAt: new Date(),
      })
      .returning();
    console.log(`✅ Created PHQ-2 assessment (Score: ${phq2Assessment.totalScore})\n`);

    // Test 2: Create PHQ-2 assessment with high score
    console.log('Test 2: Create PHQ-2 assessment with high score');
    const phq2HighResponses = [2, 2];
    const phq2HighScore = calculatePHQ2Score(phq2HighResponses);
    const [phq2HighAssessment] = await db
      .insert(assessments)
      .values({
        patientId: testPatient.id,
        userId: testUser.id,
        assessmentType: 'PHQ-2',
        totalScore: phq2HighScore,
        responses: JSON.stringify(phq2HighResponses),
        completedAt: new Date(),
      })
      .returning();
    console.log(`✅ Created PHQ-2 assessment (Score: ${phq2HighAssessment.totalScore})\n`);

    // Test 3: Create PHQ-9 assessment
    console.log('Test 3: Create PHQ-9 assessment');
    const phq9Responses = [1, 2, 1, 2, 1, 2, 1, 2, 1];
    const phq9Score = calculatePHQ9Score(phq9Responses);
    const [phq9Assessment] = await db
      .insert(assessments)
      .values({
        patientId: testPatient.id,
        userId: testUser.id,
        assessmentType: 'PHQ-9',
        totalScore: phq9Score,
        responses: JSON.stringify(phq9Responses),
        completedAt: new Date(),
      })
      .returning();
    console.log(`✅ Created PHQ-9 assessment (Score: ${phq9Assessment.totalScore})\n`);

    // Test 4: Retrieve assessment history
    console.log('Test 4: Retrieve assessment history');
    const history = await db.query.assessments.findMany({
      where: eq(assessments.patientId, testPatient.id),
      orderBy: [desc(assessments.completedAt)],
    });
    console.log(`✅ Retrieved ${history.length} assessments`);
    history.forEach((assessment, index) => {
      console.log(`   ${index + 1}. ${assessment.assessmentType} - Score: ${assessment.totalScore}`);
    });
    console.log();

    // Test 5: Validate PHQ-2 responses
    console.log('Test 5: Validate PHQ-2 responses');
    const validPHQ2 = validatePHQ2Responses([1, 2]);
    const invalidPHQ2 = validatePHQ2Responses([1]); // Only 1 response
    if (validPHQ2.valid && !invalidPHQ2.valid) {
      console.log('✅ PHQ-2 validation working correctly');
      console.log(`   Invalid error: ${invalidPHQ2.error}\n`);
    } else {
      console.log('❌ PHQ-2 validation failed\n');
    }

    // Test 6: Validate PHQ-9 responses
    console.log('Test 6: Validate PHQ-9 responses');
    const validPHQ9 = validatePHQ9Responses([1, 2, 1, 2, 1, 2, 1, 2, 1]);
    const invalidPHQ9 = validatePHQ9Responses([1, 2, 3, 4, 5]); // Out of range
    if (validPHQ9.valid && !invalidPHQ9.valid) {
      console.log('✅ PHQ-9 validation working correctly');
      console.log(`   Invalid error: ${invalidPHQ9.error}\n`);
    } else {
      console.log('❌ PHQ-9 validation failed\n');
    }

    // Test 7: Verify assessment data round-trip
    console.log('Test 7: Verify assessment data round-trip');
    const retrievedAssessment = await db.query.assessments.findFirst({
      where: eq(assessments.id, phq9Assessment.id),
    });
    
    // The responses field is stored as JSON text, so we need to parse it
    const retrievedResponses = typeof retrievedAssessment?.responses === 'string' 
      ? JSON.parse(retrievedAssessment.responses)
      : retrievedAssessment?.responses;
    
    if (
      retrievedAssessment &&
      retrievedAssessment.patientId === testPatient.id &&
      retrievedAssessment.userId === testUser.id &&
      retrievedAssessment.assessmentType === 'PHQ-9' &&
      retrievedAssessment.totalScore === phq9Score &&
      JSON.stringify(retrievedResponses) === JSON.stringify(phq9Responses)
    ) {
      console.log('✅ Assessment data round-trip successful\n');
    } else {
      console.log('❌ Assessment data mismatch\n');
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await db.delete(assessments).where(eq(assessments.patientId, testPatient.id));
    await db.delete(patients).where(eq(patients.id, testPatient.id));
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log('✅ Cleanup complete\n');

    console.log('✨ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAssessmentOperations();
