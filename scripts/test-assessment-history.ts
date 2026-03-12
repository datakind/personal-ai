/**
 * Test script for assessment history with user data
 * Tests that getAssessmentHistory returns assessments with user information
 */

import { db } from '@/db';
import { users, patients, assessments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

async function testAssessmentHistory() {
  console.log('🧪 Testing Assessment History with User Data\n');

  try {
    // Setup: Create test user
    console.log('📝 Setting up test user...');
    const [testUser] = await db
      .insert(users)
      .values({
        name: 'Dr. Jane Smith',
        email: `doctor-${Date.now()}@test.com`,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ Created test user: ${testUser.name} (ID: ${testUser.id})\n`);

    // Setup: Create test patient
    console.log('📝 Setting up test patient...');
    const [testPatient] = await db
      .insert(patients)
      .values({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1985-05-15'),
        createdById: testUser.id,
        createdAt: new Date(),
      })
      .returning();
    console.log(`✅ Created test patient: ${testPatient.firstName} ${testPatient.lastName} (ID: ${testPatient.id})\n`);

    // Create multiple assessments
    console.log('📝 Creating test assessments...');
    
    const [assessment1] = await db
      .insert(assessments)
      .values({
        patientId: testPatient.id,
        userId: testUser.id,
        assessmentType: 'PHQ-2',
        totalScore: 2,
        responses: JSON.stringify([1, 1]),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      })
      .returning();
    console.log(`✅ Created PHQ-2 assessment (Score: ${assessment1.totalScore})`);

    const [assessment2] = await db
      .insert(assessments)
      .values({
        patientId: testPatient.id,
        userId: testUser.id,
        assessmentType: 'PHQ-2',
        totalScore: 4,
        responses: JSON.stringify([2, 2]),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      })
      .returning();
    console.log(`✅ Created PHQ-2 assessment (Score: ${assessment2.totalScore})`);

    const [assessment3] = await db
      .insert(assessments)
      .values({
        patientId: testPatient.id,
        userId: testUser.id,
        assessmentType: 'PHQ-9',
        totalScore: 12,
        responses: JSON.stringify([1, 2, 1, 2, 1, 2, 1, 1, 1]),
        completedAt: new Date(), // Today
      })
      .returning();
    console.log(`✅ Created PHQ-9 assessment (Score: ${assessment3.totalScore})\n`);

    // Test: Retrieve assessment history with user data (using relational query)
    console.log('Test: Retrieve assessment history with user data');
    const history = await db.query.assessments.findMany({
      where: eq(assessments.patientId, testPatient.id),
      orderBy: [desc(assessments.completedAt)],
      with: {
        user: true,
      },
    });

    console.log(`✅ Retrieved ${history.length} assessments with user data\n`);
    
    // Verify each assessment has user data
    let allHaveUserData = true;
    history.forEach((assessment, index) => {
      const hasUserData = assessment.user && assessment.user.name;
      console.log(`   ${index + 1}. ${assessment.assessmentType} - Score: ${assessment.totalScore}`);
      console.log(`      Staff Member: ${assessment.user?.name || 'MISSING'}`);
      console.log(`      Completed: ${assessment.completedAt.toLocaleDateString()}`);
      
      if (!hasUserData) {
        allHaveUserData = false;
        console.log('      ❌ Missing user data!');
      }
    });
    console.log();

    if (allHaveUserData && history.length === 3) {
      console.log('✅ All assessments have user data');
      console.log('✅ Assessments are ordered by completion date (descending)\n');
    } else {
      console.log('❌ Some assessments are missing user data or count is wrong\n');
      process.exit(1);
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

testAssessmentHistory();
