import { db } from '@/db';
import { trainingCompletions, trainingMaterials } from '@/db/schema';
import type { TrainingCompletion, TrainingMaterial } from '@/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

/**
 * Creates a new training material record.
 * 
 * Validates that all required fields (title, content, categoryId) are provided
 * and are non-empty strings. Inserts the material into the database with
 * automatic timestamps.
 * 
 * @param title - The title of the training material (must be non-empty)
 * @param content - The content of the training material (must be non-empty)
 * @param categoryId - The category identifier for the training material (must be non-empty)
 * @returns Object with success status and either the created material or error message
 * 
 * Validates:
 * - Requirements 1.1: Store training materials with a unique identifier
 * - Requirements 1.2: Store training material title
 * - Requirements 1.3: Store training material content
 * - Requirements 1.4: Store training material category identifier
 */
export async function createTrainingMaterial(
  title: string,
  content: string,
  categoryId: string
): Promise<
  | { success: true; material: TrainingMaterial }
  | { success: false; error: string }
> {
  // Validate required fields are non-empty strings
  if (!title || title.trim() === '') {
    return {
      success: false,
      error: 'Title is required and cannot be empty',
    };
  }

  if (!content || content.trim() === '') {
    return {
      success: false,
      error: 'Content is required and cannot be empty',
    };
  }

  if (!categoryId || categoryId.trim() === '') {
    return {
      success: false,
      error: 'Category ID is required and cannot be empty',
    };
  }

  try {
    const [material] = await db
      .insert(trainingMaterials)
      .values({
        title,
        content,
        categoryId,
      })
      .returning();

    return { success: true, material };
  } catch (error) {
    // Re-throw unexpected errors
    throw error;
  }
}
/**
 * Updates an existing training material record.
 *
 * Accepts partial update data - all fields (title, content, categoryId) are optional.
 * The updatedAt timestamp is automatically updated by the schema's $onUpdate handler.
 *
 * @param materialId - The ID of the training material to update
 * @param updates - Partial update data with optional title, content, and/or categoryId
 * @returns Object with success status and either the updated material or error message
 *
 * Validates:
 * - Requirements 1.6: Store training material last updated timestamp
 */
export async function updateTrainingMaterial(
  materialId: number,
  updates: {
    title?: string;
    content?: string;
    categoryId?: string;
  }
): Promise<
  | { success: true; material: TrainingMaterial }
  | { success: false; error: string }
> {
  // Validate that at least one field is being updated
  if (!updates.title && !updates.content && !updates.categoryId) {
    return {
      success: false,
      error: 'At least one field must be provided for update',
    };
  }

  // Validate non-empty strings for provided fields
  if (updates.title !== undefined && updates.title.trim() === '') {
    return {
      success: false,
      error: 'Title cannot be empty',
    };
  }

  if (updates.content !== undefined && updates.content.trim() === '') {
    return {
      success: false,
      error: 'Content cannot be empty',
    };
  }

  if (updates.categoryId !== undefined && updates.categoryId.trim() === '') {
    return {
      success: false,
      error: 'Category ID cannot be empty',
    };
  }

  try {
    const [material] = await db
      .update(trainingMaterials)
      .set(updates)
      .where(eq(trainingMaterials.id, materialId))
      .returning();

    if (!material) {
      return {
        success: false,
        error: 'Training material not found',
      };
    }

    return { success: true, material };
  } catch (error) {
    // Re-throw unexpected errors
    throw error;
  }
}


/**
 * Records a training completion for a user.
 * 
 * Creates a new completion record with synced=false by default.
 * Handles duplicate completion attempts by catching unique constraint violations.
 * 
 * @param userId - The ID of the user completing the training
 * @param materialId - The ID of the training material being completed
 * @returns Object with success status and either the completion record or error message
 * 
 * Validates:
 * - Requirements 2.1: Create completion record when user completes training
 * - Requirements 2.2: Reference user record identifier
 * - Requirements 2.3: Reference training material identifier
 * - Requirements 2.4: Store completion timestamp
 * - Requirements 2.5: Prevent duplicate completions for same user-material pair
 */
export async function recordTrainingCompletion(
  userId: number,
  materialId: number
): Promise<
  | { success: true; completion: TrainingCompletion }
  | { success: false; error: string }
> {
  try {
    const [completion] = await db
      .insert(trainingCompletions)
      .values({
        userId,
        materialId,
        synced: false,
      })
      .returning();

    return { success: true, completion };
  } catch (error) {
    // Handle unique constraint violation (duplicate completion)
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      return {
        success: false,
        error: 'Training has already been completed by this user',
      };
    }

    // Handle foreign key constraint violations
    if (
      error instanceof Error &&
      error.message.includes('FOREIGN KEY constraint failed')
    ) {
      return {
        success: false,
        error: 'Invalid user ID or material ID',
      };
    }

    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Gets a user's training completion history with material details.
 * 
 * Uses relational query API to fetch completions with joined material data.
 * Results are ordered by completion timestamp descending (most recent first).
 * 
 * @param userId - The ID of the user whose completion history to retrieve
 * @returns Array of completion records with joined material data
 * 
 * Validates:
 * - Requirements 3.1: Return all completion records for a user
 * - Requirements 3.2: Return records ordered by completion timestamp
 */
export async function getUserCompletionHistory(userId: number) {
  const userCompletions = await db.query.trainingCompletions.findMany({
    where: (completions, { eq }) => eq(completions.userId, userId),
    orderBy: (completions, { desc }) => [desc(completions.completedAt)],
    with: {
      material: true,
    },
  });

  return userCompletions;
}

/**
 * Checks if a user has completed a specific training material.
 * 
 * Queries for a completion record matching the user-material pair.
 * Returns true if a completion exists, false otherwise.
 * 
 * @param userId - The ID of the user to check
 * @param materialId - The ID of the training material to check
 * @returns Boolean indicating whether the user has completed the material
 * 
 * Validates:
 * - Requirements 3.4: Support querying whether a specific user has completed a specific training material
 */
export async function hasUserCompletedMaterial(
  userId: number,
  materialId: number
): Promise<boolean> {
  const completion = await db.query.trainingCompletions.findFirst({
    where: (completions, { eq, and }) =>
      and(
        eq(completions.userId, userId),
        eq(completions.materialId, materialId)
      ),
  });

  return completion !== undefined;
}

/**
 * Gets all users who completed a specific training material.
 * 
 * Uses relational query API to fetch completions with joined user data.
 * Returns all completion records for the specified material with user details.
 * 
 * @param materialId - The ID of the training material to query
 * @returns Array of completion records with joined user data
 * 
 * Validates:
 * - Requirements 3.3: Return all users who completed a specific training material
 */
export async function getMaterialCompletions(materialId: number) {
  const completions = await db.query.trainingCompletions.findMany({
    where: (completions, { eq }) => eq(completions.materialId, materialId),
    with: {
      user: true,
    },
  });

  return completions;
}

/**
 * Gets unsynced completion records for a specific user.
 * 
 * Queries completions where userId matches and synced is false.
 * Includes material details for sync payload preparation.
 * 
 * @param userId - The ID of the user whose unsynced completions to retrieve
 * @returns Array of unsynced completion records with joined material data
 * 
 * Validates:
 * - Requirements 4.3: Support querying unsynced Completion_Records for a specific user
 */
export async function getUnsyncedCompletions(userId: number) {
  const unsyncedCompletions = await db.query.trainingCompletions.findMany({
    where: (completions, { eq, and }) => and(
      eq(completions.userId, userId),
      eq(completions.synced, false)
    ),
    with: {
      material: true,
    },
  });

  return unsyncedCompletions;
}

/**
 * Marks a completion record as synced with the remote storage system.
 * 
 * Updates the completion record to set synced=true and lastSyncedAt to current timestamp.
 * Optionally updates the remoteId if provided.
 * 
 * @param completionId - The ID of the completion record to mark as synced
 * @param remoteId - Optional remote storage system identifier for the completion
 * @returns Object with success status and either the updated completion record or error message
 * 
 * Validates:
 * - Requirements 4.1: Track whether each Completion_Record has been synced to the Storage_System
 * - Requirements 4.2: Store the last sync timestamp for each Completion_Record
 */
export async function markCompletionAsSynced(
  completionId: number,
  remoteId?: string
): Promise<
  | { success: true; completion: TrainingCompletion }
  | { success: false; error: string }
> {
  try {
    const updateData: {
      synced: boolean;
      lastSyncedAt: Date;
      remoteId?: string;
    } = {
      synced: true,
      lastSyncedAt: new Date(),
    };

    if (remoteId !== undefined) {
      updateData.remoteId = remoteId;
    }

    const [completion] = await db
      .update(trainingCompletions)
      .set(updateData)
      .where(eq(trainingCompletions.id, completionId))
      .returning();

    if (!completion) {
      return {
        success: false,
        error: 'Completion record not found',
      };
    }

    return { success: true, completion };
  } catch (error) {
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Creates a completion record from remote sync data.
 * 
 * Inserts a new completion record with synced=true, remoteId set, and lastSyncedAt=current timestamp.
 * Handles the case where a completion already exists locally (e.g., user completed training before syncing).
 * If a local completion exists, updates it with the remote sync metadata.
 * 
 * @param userId - The ID of the user who completed the training
 * @param materialId - The ID of the training material that was completed
 * @param remoteId - The remote storage system identifier for the completion
 * @param completedAt - Optional completion timestamp; defaults to current time if not provided
 * @returns Object with success status and either the completion record or error message
 * 
 * Validates:
 * - Requirements 4.4: Store the remote record identifier when completion originates from Storage_System
 */
export async function createCompletionFromRemoteSync(
  userId: number,
  materialId: number,
  remoteId: string,
  completedAt?: Date
): Promise<
  | { success: true; completion: TrainingCompletion }
  | { success: false; error: string }
> {
  try {
    const now = new Date();
    const [completion] = await db
      .insert(trainingCompletions)
      .values({
        userId,
        materialId,
        completedAt: completedAt ?? now,
        synced: true,
        lastSyncedAt: now,
        remoteId,
      })
      .returning();

    return { success: true, completion };
  } catch (error) {
    // Handle unique constraint violation (completion already exists locally)
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      // Find the existing completion and update it with remote sync metadata
      const existingCompletion = await db.query.trainingCompletions.findFirst({
        where: (completions, { eq, and }) =>
          and(
            eq(completions.userId, userId),
            eq(completions.materialId, materialId)
          ),
      });

      if (!existingCompletion) {
        return {
          success: false,
          error: 'Completion exists but could not be retrieved',
        };
      }

      // Update the existing completion with remote sync metadata
      const [updatedCompletion] = await db
        .update(trainingCompletions)
        .set({
          synced: true,
          lastSyncedAt: new Date(),
          remoteId,
        })
        .where(eq(trainingCompletions.id, existingCompletion.id))
        .returning();

      return { success: true, completion: updatedCompletion };
    }

    // Handle foreign key constraint violations
    if (
      error instanceof Error &&
      error.message.includes('FOREIGN KEY constraint failed')
    ) {
      return {
        success: false,
        error: 'Invalid user ID or material ID',
      };
    }

    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Deletes a training material by ID.
 * 
 * Removes the training material record from the database.
 * The CASCADE delete constraint automatically removes all associated completion records.
 * 
 * @param materialId - The ID of the training material to delete
 * @returns Object with success status and error message if deletion fails
 * 
 * Validates:
 * - Requirements 5.2: When a Training_Material is deleted, delete all associated Completion_Records
 */
export async function deleteTrainingMaterial(
  materialId: number
): Promise<
  | { success: true }
  | { success: false; error: string }
> {
  try {
    const result = await db
      .delete(trainingMaterials)
      .where(eq(trainingMaterials.id, materialId))
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        error: 'Training material not found',
      };
    }

    return { success: true };
  } catch (error) {
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Queries completion records within a timestamp range.
 * 
 * Returns all completion records where completedAt falls between the start and end dates (inclusive).
 * Includes material details for each completion.
 * 
 * @param startDate - The start of the timestamp range (inclusive)
 * @param endDate - The end of the timestamp range (inclusive)
 * @returns Array of completion records with joined material data
 * 
 * Validates:
 * - Requirements 7.4: Support querying records by timestamp ranges
 */
export async function getCompletionsByTimestampRange(
  startDate: Date,
  endDate: Date
) {
  const completions = await db.query.trainingCompletions.findMany({
    where: (completions, { and, gte, lte }) =>
      and(
        gte(completions.completedAt, startDate),
        lte(completions.completedAt, endDate)
      ),
    with: {
      material: true,
    },
  });

  return completions;
}
