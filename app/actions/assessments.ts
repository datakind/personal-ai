'use server';

import { db } from '@/db';
import { assessments, patients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, isUserPHQ9Qualified } from '@/lib/auth';
import {
  validatePHQ2Responses,
  validatePHQ9Responses,
  calculatePHQ2Score,
  calculatePHQ9Score,
  requiresPHQ9,
} from '@/lib/assessments';

/**
 * Submit PHQ-2 Assessment Server Action
 * Validates and stores a PHQ-2 assessment, calculates score, and determines if PHQ-9 is required.
 * 
 * @param patientId - The ID of the patient being assessed
 * @param responses - Array of 2 integers (0-3) representing PHQ-2 responses
 * @returns Object with success status, score, requiresPHQ9 flag, userQualified flag, or error message
 */
export async function submitPHQ2(
  patientId: number,
  responses: number[]
): Promise<{
  success: boolean;
  score?: number;
  requiresPHQ9?: boolean;
  userQualified?: boolean;
  error?: string;
}> {
  try {
    // Check authentication
    const user = await requireAuth();

    // Validate patient exists
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, patientId),
    });

    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    // Validate responses
    const validation = validatePHQ2Responses(responses);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Calculate score
    const totalScore = calculatePHQ2Score(responses);

    // Store assessment
    await db.insert(assessments).values({
      patientId,
      userId: user.id,
      assessmentType: 'PHQ-2',
      totalScore,
      responses: JSON.stringify(responses),
      completedAt: new Date(),
    });

    // Determine if PHQ-9 is required
    const phq9Required = requiresPHQ9(totalScore);

    // Check user qualification if PHQ-9 is required
    let userQualified = false;
    if (phq9Required) {
      userQualified = await isUserPHQ9Qualified(user.id);
    }

    return {
      success: true,
      score: totalScore,
      requiresPHQ9: phq9Required,
      userQualified,
    };
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return { success: false, error: 'Authentication required' };
    }

    // Log and return generic error
    console.error('Submit PHQ-2 error:', error);
    return { success: false, error: 'Failed to submit PHQ-2 assessment' };
  }
}

/**
 * Submit PHQ-9 Assessment Server Action
 * Validates and stores a PHQ-9 assessment and calculates score.
 * 
 * @param patientId - The ID of the patient being assessed
 * @param responses - Array of 9 integers (0-3) representing PHQ-9 responses
 * @returns Object with success status, score, or error message
 */
export async function submitPHQ9(
  patientId: number,
  responses: number[]
): Promise<{
  success: boolean;
  score?: number;
  error?: string;
}> {
  try {
    // Check authentication
    const user = await requireAuth();

    // Validate patient exists
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, patientId),
    });

    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    // Validate responses
    const validation = validatePHQ9Responses(responses);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Calculate score
    const totalScore = calculatePHQ9Score(responses);

    // Store assessment
    await db.insert(assessments).values({
      patientId,
      userId: user.id,
      assessmentType: 'PHQ-9',
      totalScore,
      responses: JSON.stringify(responses),
      completedAt: new Date(),
    });

    return {
      success: true,
      score: totalScore,
    };
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return { success: false, error: 'Authentication required' };
    }

    // Log and return generic error
    console.error('Submit PHQ-9 error:', error);
    return { success: false, error: 'Failed to submit PHQ-9 assessment' };
  }
}

/**
 * Get Assessment History Server Action
 * Retrieves all assessments for a specific patient ordered by completion date (newest first).
 * Includes the staff member (user) information for each assessment.
 * Requires authentication.
 * 
 * @param patientId - The ID of the patient to retrieve assessments for
 * @returns Array of assessment records with user information
 */
export async function getAssessmentHistory(patientId: number) {
  try {
    // Check authentication
    await requireAuth();

    const history = await db.query.assessments.findMany({
      where: eq(assessments.patientId, patientId),
      orderBy: [desc(assessments.completedAt)],
      with: {
        user: true,
      },
    });

    return history;
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      console.error('Get assessment history error: Authentication required');
      return [];
    }

    console.error('Get assessment history error:', error);
    return [];
  }
}
