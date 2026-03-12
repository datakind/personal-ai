'use server';

import { db } from '@/db';
import { patients, type Patient } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

/**
 * Create Patient Server Action
 * Creates a new patient record with validation and authentication check.
 * 
 * @param formData - Form data containing firstName, lastName, and dateOfBirth fields
 * @returns An object with success status, patientId on success, or error message and field on failure
 */
export async function createPatient(formData: FormData): Promise<{
  success: boolean;
  patientId?: number;
  error?: string;
  field?: string;
}> {
  try {
    // Check authentication - throws error if not authenticated
    const user = await requireAuth();

    // Extract form data
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const dateOfBirth = formData.get('dateOfBirth');

    // Validate firstName
    if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
      return { success: false, error: 'First name is required', field: 'firstName' };
    }

    if (firstName.trim().length > 255) {
      return { success: false, error: 'First name must be 255 characters or less', field: 'firstName' };
    }

    // Validate lastName
    if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
      return { success: false, error: 'Last name is required', field: 'lastName' };
    }

    if (lastName.trim().length > 255) {
      return { success: false, error: 'Last name must be 255 characters or less', field: 'lastName' };
    }

    // Validate dateOfBirth
    if (!dateOfBirth || typeof dateOfBirth !== 'string') {
      return { success: false, error: 'Date of birth is required', field: 'dateOfBirth' };
    }

    const dobDate = new Date(dateOfBirth);
    
    // Check if date is valid
    if (isNaN(dobDate.getTime())) {
      return { success: false, error: 'Date of birth must be a valid date', field: 'dateOfBirth' };
    }

    // Check if date is in the past
    const now = new Date();
    if (dobDate >= now) {
      return { success: false, error: 'Date of birth must be a valid date in the past', field: 'dateOfBirth' };
    }

    // Insert patient record
    const [newPatient] = await db
      .insert(patients)
      .values({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dobDate,
        createdById: user.id,
        createdAt: new Date(),
      })
      .returning();

    return {
      success: true,
      patientId: newPatient.id,
    };
  } catch (error) {
    // Handle authentication errors specifically
    if (error instanceof Error && error.message === 'Authentication required') {
      return { success: false, error: 'Authentication required' };
    }

    // Log and return generic error for other failures
    console.error('Create patient error:', error);
    return { success: false, error: 'Failed to create patient record' };
  }
}

/**
 * Get Patients Server Action
 * Retrieves all patient records ordered by creation date (newest first).
 * Requires authentication.
 * 
 * @returns Array of patient records
 */
export async function getPatients(): Promise<Patient[]> {
  try {
    // Check authentication
    await requireAuth();

    const allPatients = await db.query.patients.findMany({
      orderBy: [desc(patients.createdAt)],
    });

    return allPatients;
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      console.error('Get patients error: Authentication required');
      return [];
    }

    console.error('Get patients error:', error);
    return [];
  }
}

/**
 * Get Patient Server Action
 * Retrieves a single patient record by ID.
 * Requires authentication.
 * 
 * @param id - The patient ID to retrieve
 * @returns The patient record if found, or null if not found
 */
export async function getPatient(id: number): Promise<Patient | null> {
  try {
    // Check authentication
    await requireAuth();

    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, id),
    });

    return patient || null;
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      console.error('Get patient error: Authentication required');
      return null;
    }

    console.error('Get patient error:', error);
    return null;
  }
}
