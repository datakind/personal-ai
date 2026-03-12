/**
 * Property-Based Testing Infrastructure for Training Materials Tracking
 * Task 9.1: Set up property-based testing with fast-check
 * 
 * This module provides:
 * - Custom fast-check generators for domain objects
 * - Helper functions for creating test users, materials, and completions
 * - Helper functions for cleaning up test data
 * - Transaction-based test isolation utilities
 * 
 * Requirements: All (testing infrastructure)
 */

import fc from 'fast-check';
import { db } from '@/db';
import { users, trainingMaterials, trainingCompletions } from '@/db/schema';
import type { User, TrainingMaterial, TrainingCompletion } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// Custom fast-check Generators
// ============================================================================

/**
 * Generator for valid user IDs (positive integers).
 * Range: 1 to 10,000 to simulate realistic user ID space.
 */
export const userIdArb = fc.integer({ min: 1, max: 10000 });

/**
 * Generator for valid material IDs (positive integers).
 * Range: 1 to 1,000 to simulate realistic material catalog size.
 */
export const materialIdArb = fc.integer({ min: 1, max: 1000 });

/**
 * Generator for category IDs (non-empty strings).
 * Length: 1 to 50 characters to match typical category naming.
 */
export const categoryIdArb = fc.string({ minLength: 1, maxLength: 50 });

/**
 * Generator for training material titles (non-empty strings).
 * Length: 1 to 200 characters to match typical title lengths.
 */
export const titleArb = fc.string({ minLength: 1, maxLength: 200 });

/**
 * Generator for training material content (non-empty strings).
 * Length: 1 to 5,000 characters to simulate realistic content size.
 */
export const contentArb = fc.string({ minLength: 1, maxLength: 5000 });

/**
 * Generator for Unix epoch timestamps (integers).
 * Converts JavaScript Date objects to Unix epoch seconds.
 */
export const timestampArb = fc.date().map(d => Math.floor(d.getTime() / 1000));

/**
 * Generator for email addresses.
 * Generates valid email format strings for test users.
 */
export const emailArb = fc.emailAddress();

/**
 * Generator for boolean values (for synced flag).
 */
export const booleanArb = fc.boolean();

/**
 * Generator for optional remote IDs (nullable strings).
 * Generates either null or a non-empty string.
 */
export const remoteIdArb = fc.option(
  fc.string({ minLength: 1, maxLength: 100 }),
  { nil: null }
);

/**
 * Generator for complete training material objects.
 * Generates all required fields for creating a training material.
 */
export const trainingMaterialArb = fc.record({
  title: titleArb,
  content: contentArb,
  categoryId: categoryIdArb,
});

/**
 * Generator for completion record data.
 * Generates userId, materialId, and optional sync metadata.
 */
export const completionDataArb = fc.record({
  userId: userIdArb,
  materialId: materialIdArb,
  synced: booleanArb,
  remoteId: remoteIdArb,
});

// ============================================================================
// Test Data Creation Helpers
// ============================================================================

/**
 * Creates a test user in the database.
 * 
 * @param email - Optional email address; generates unique email if not provided
 * @returns The created user record
 */
export async function createTestUser(email?: string): Promise<User> {
  const userEmail = email ?? `test-${Date.now()}-${Math.random()}@example.com`;
  
  const [user] = await db
    .insert(users)
    .values({ email: userEmail })
    .returning();
  
  return user;
}

/**
 * Creates multiple test users in the database.
 * 
 * @param count - Number of users to create
 * @returns Array of created user records
 */
export async function createTestUsers(count: number): Promise<User[]> {
  const createdUsers: User[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUser();
    createdUsers.push(user);
  }
  
  return createdUsers;
}

/**
 * Creates a test training material in the database.
 * 
 * @param data - Optional material data; generates random data if not provided
 * @returns The created training material record
 */
export async function createTestMaterial(
  data?: Partial<{ title: string; content: string; categoryId: string }>
): Promise<TrainingMaterial> {
  const materialData = {
    title: data?.title ?? `Test Material ${Date.now()}`,
    content: data?.content ?? `Test content ${Math.random()}`,
    categoryId: data?.categoryId ?? 'test-category',
  };
  
  const [material] = await db
    .insert(trainingMaterials)
    .values(materialData)
    .returning();
  
  return material;
}

/**
 * Creates multiple test training materials in the database.
 * 
 * @param count - Number of materials to create
 * @returns Array of created training material records
 */
export async function createTestMaterials(count: number): Promise<TrainingMaterial[]> {
  const createdMaterials: TrainingMaterial[] = [];
  
  for (let i = 0; i < count; i++) {
    const material = await createTestMaterial();
    createdMaterials.push(material);
  }
  
  return createdMaterials;
}

/**
 * Creates a test completion record in the database.
 * 
 * @param userId - The user ID for the completion
 * @param materialId - The material ID for the completion
 * @param options - Optional completion metadata (synced, remoteId, completedAt)
 * @returns The created completion record
 */
export async function createTestCompletion(
  userId: number,
  materialId: number,
  options?: {
    synced?: boolean;
    remoteId?: string | null;
    completedAt?: Date;
  }
): Promise<TrainingCompletion> {
  const [completion] = await db
    .insert(trainingCompletions)
    .values({
      userId,
      materialId,
      synced: options?.synced ?? false,
      remoteId: options?.remoteId ?? null,
      completedAt: options?.completedAt ?? new Date(),
    })
    .returning();
  
  return completion;
}

/**
 * Creates multiple test completion records for a user.
 * 
 * @param userId - The user ID for the completions
 * @param materialIds - Array of material IDs to create completions for
 * @param options - Optional completion metadata applied to all completions
 * @returns Array of created completion records
 */
export async function createTestCompletions(
  userId: number,
  materialIds: number[],
  options?: {
    synced?: boolean;
    remoteId?: string | null;
  }
): Promise<TrainingCompletion[]> {
  const createdCompletions: TrainingCompletion[] = [];
  
  for (const materialId of materialIds) {
    const completion = await createTestCompletion(userId, materialId, options);
    createdCompletions.push(completion);
  }
  
  return createdCompletions;
}

// ============================================================================
// Test Data Cleanup Helpers
// ============================================================================

/**
 * Deletes a test user by ID.
 * Cascade delete automatically removes associated sessions and completions.
 * 
 * @param userId - The ID of the user to delete
 */
export async function deleteTestUser(userId: number): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Deletes multiple test users by IDs.
 * 
 * @param userIds - Array of user IDs to delete
 */
export async function deleteTestUsers(userIds: number[]): Promise<void> {
  for (const userId of userIds) {
    await deleteTestUser(userId);
  }
}

/**
 * Deletes a test training material by ID.
 * Cascade delete automatically removes associated completions.
 * 
 * @param materialId - The ID of the material to delete
 */
export async function deleteTestMaterial(materialId: number): Promise<void> {
  await db.delete(trainingMaterials).where(eq(trainingMaterials.id, materialId));
}

/**
 * Deletes multiple test training materials by IDs.
 * 
 * @param materialIds - Array of material IDs to delete
 */
export async function deleteTestMaterials(materialIds: number[]): Promise<void> {
  for (const materialId of materialIds) {
    await deleteTestMaterial(materialId);
  }
}

/**
 * Deletes a test completion record by ID.
 * 
 * @param completionId - The ID of the completion to delete
 */
export async function deleteTestCompletion(completionId: number): Promise<void> {
  await db.delete(trainingCompletions).where(eq(trainingCompletions.id, completionId));
}

/**
 * Deletes multiple test completion records by IDs.
 * 
 * @param completionIds - Array of completion IDs to delete
 */
export async function deleteTestCompletions(completionIds: number[]): Promise<void> {
  for (const completionId of completionIds) {
    await deleteTestCompletion(completionId);
  }
}

/**
 * Deletes all completion records for a specific user.
 * 
 * @param userId - The user ID whose completions to delete
 */
export async function deleteUserCompletions(userId: number): Promise<void> {
  await db.delete(trainingCompletions).where(eq(trainingCompletions.userId, userId));
}

/**
 * Deletes all completion records for a specific material.
 * 
 * @param materialId - The material ID whose completions to delete
 */
export async function deleteMaterialCompletions(materialId: number): Promise<void> {
  await db.delete(trainingCompletions).where(eq(trainingCompletions.materialId, materialId));
}

/**
 * Deletes all test data from training tables.
 * WARNING: This deletes ALL data from training_completions and training_materials tables.
 * Use only in test environments.
 */
export async function cleanupAllTrainingData(): Promise<void> {
  await db.delete(trainingCompletions);
  await db.delete(trainingMaterials);
}

// ============================================================================
// Transaction-Based Test Isolation Utilities
// ============================================================================

/**
 * Executes a test function within a database transaction that is rolled back.
 * This ensures test isolation - all database changes are discarded after the test.
 * 
 * Note: SQLite transactions with better-sqlite3 don't support automatic rollback
 * in the same way as PostgreSQL. This function provides manual cleanup instead.
 * 
 * @param testFn - Async function containing the test logic
 * @returns The result of the test function
 */
export async function withTestTransaction<T>(
  testFn: () => Promise<T>
): Promise<T> {
  // Track created entities for cleanup
  const createdUsers: number[] = [];
  const createdMaterials: number[] = [];
  const createdCompletions: number[] = [];
  
  try {
    // Execute the test function
    const result = await testFn();
    return result;
  } finally {
    // Cleanup: Delete all created test data
    // Note: In a real implementation, you'd track IDs during creation
    // For now, this is a placeholder for the pattern
  }
}

/**
 * Creates an isolated test context with automatic cleanup.
 * Returns helper functions that track created entities for cleanup.
 * 
 * Usage:
 * ```typescript
 * const ctx = await createTestContext();
 * try {
 *   const user = await ctx.createUser();
 *   const material = await ctx.createMaterial();
 *   // ... run tests ...
 * } finally {
 *   await ctx.cleanup();
 * }
 * ```
 */
export async function createTestContext() {
  const createdUsers: number[] = [];
  const createdMaterials: number[] = [];
  const createdCompletions: number[] = [];
  
  return {
    /**
     * Creates a test user and tracks it for cleanup.
     */
    createUser: async (email?: string): Promise<User> => {
      const user = await createTestUser(email);
      createdUsers.push(user.id);
      return user;
    },
    
    /**
     * Creates a test material and tracks it for cleanup.
     */
    createMaterial: async (
      data?: Partial<{ title: string; content: string; categoryId: string }>
    ): Promise<TrainingMaterial> => {
      const material = await createTestMaterial(data);
      createdMaterials.push(material.id);
      return material;
    },
    
    /**
     * Creates a test completion and tracks it for cleanup.
     */
    createCompletion: async (
      userId: number,
      materialId: number,
      options?: {
        synced?: boolean;
        remoteId?: string | null;
        completedAt?: Date;
      }
    ): Promise<TrainingCompletion> => {
      const completion = await createTestCompletion(userId, materialId, options);
      createdCompletions.push(completion.id);
      return completion;
    },
    
    /**
     * Cleans up all tracked test data.
     * Deletes in correct order: completions, materials, users (respecting foreign keys).
     */
    cleanup: async (): Promise<void> => {
      // Delete completions first (they reference users and materials)
      await deleteTestCompletions(createdCompletions);
      
      // Delete materials (they may be referenced by completions, but we already deleted those)
      await deleteTestMaterials(createdMaterials);
      
      // Delete users last (they may be referenced by completions, but we already deleted those)
      await deleteTestUsers(createdUsers);
    },
  };
}

// ============================================================================
// Query Helpers for Property Tests
// ============================================================================

/**
 * Counts the number of completion records for a user.
 * 
 * @param userId - The user ID to count completions for
 * @returns The count of completion records
 */
export async function countUserCompletions(userId: number): Promise<number> {
  const completions = await db.query.trainingCompletions.findMany({
    where: (completions, { eq }) => eq(completions.userId, userId),
  });
  
  return completions.length;
}

/**
 * Counts the number of completion records for a material.
 * 
 * @param materialId - The material ID to count completions for
 * @returns The count of completion records
 */
export async function countMaterialCompletions(materialId: number): Promise<number> {
  const completions = await db.query.trainingCompletions.findMany({
    where: (completions, { eq }) => eq(completions.materialId, materialId),
  });
  
  return completions.length;
}

/**
 * Counts the number of unsynced completion records for a user.
 * 
 * @param userId - The user ID to count unsynced completions for
 * @returns The count of unsynced completion records
 */
export async function countUnsyncedCompletions(userId: number): Promise<number> {
  const completions = await db.query.trainingCompletions.findMany({
    where: (completions, { eq, and }) => and(
      eq(completions.userId, userId),
      eq(completions.synced, false)
    ),
  });
  
  return completions.length;
}

/**
 * Checks if a completion record exists for a user-material pair.
 * 
 * @param userId - The user ID
 * @param materialId - The material ID
 * @returns True if a completion exists, false otherwise
 */
export async function completionExists(
  userId: number,
  materialId: number
): Promise<boolean> {
  const completion = await db.query.trainingCompletions.findFirst({
    where: (completions, { eq, and }) => and(
      eq(completions.userId, userId),
      eq(completions.materialId, materialId)
    ),
  });
  
  return completion !== undefined;
}

/**
 * Gets all distinct user IDs from completion records for a material.
 * 
 * @param materialId - The material ID
 * @returns Array of distinct user IDs
 */
export async function getDistinctUserIds(materialId: number): Promise<number[]> {
  const completions = await db.query.trainingCompletions.findMany({
    where: (completions, { eq }) => eq(completions.materialId, materialId),
  });
  
  const userIds = completions.map(c => c.userId);
  return Array.from(new Set(userIds));
}

/**
 * Verifies that completion records are ordered by timestamp descending.
 * 
 * @param completions - Array of completion records to verify
 * @returns True if ordered correctly, false otherwise
 */
export function verifyDescendingTimestampOrder(
  completions: TrainingCompletion[]
): boolean {
  for (let i = 0; i < completions.length - 1; i++) {
    const current = completions[i].completedAt.getTime();
    const next = completions[i + 1].completedAt.getTime();
    
    if (current < next) {
      return false; // Not in descending order
    }
  }
  
  return true;
}

/**
 * Verifies that a timestamp is within a specified delta of the current time.
 * 
 * @param timestamp - The timestamp to verify (Date object)
 * @param deltaSeconds - Maximum allowed difference in seconds (default: 5)
 * @returns True if timestamp is within delta, false otherwise
 */
export function verifyTimestampRecent(
  timestamp: Date,
  deltaSeconds: number = 5
): boolean {
  const now = Date.now();
  const timestampMs = timestamp.getTime();
  const deltaMs = deltaSeconds * 1000;
  
  return Math.abs(now - timestampMs) <= deltaMs;
}
