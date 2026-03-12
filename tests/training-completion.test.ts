import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '@/db';
import { users, trainingMaterials, trainingCompletions } from '@/db/schema';
import { recordTrainingCompletion } from '@/lib/training';
import { eq, and } from 'drizzle-orm';

describe('recordTrainingCompletion', () => {
  let testUserId: number;
  let testMaterialId: number;

  beforeAll(async () => {
    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: 'test-completion@example.com',
      })
      .returning();
    testUserId = user.id;

    // Create test training material
    const [material] = await db
      .insert(trainingMaterials)
      .values({
        title: 'Test Training Material',
        content: 'Test content for completion tracking',
        categoryId: 'test-category',
      })
      .returning();
    testMaterialId = material.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db
      .delete(trainingCompletions)
      .where(eq(trainingCompletions.userId, testUserId));
    await db.delete(trainingMaterials).where(eq(trainingMaterials.id, testMaterialId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should successfully create a completion record', async () => {
    const result = await recordTrainingCompletion(testUserId, testMaterialId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.completion.userId).toBe(testUserId);
      expect(result.completion.materialId).toBe(testMaterialId);
      expect(result.completion.synced).toBe(false);
      expect(result.completion.completedAt).toBeInstanceOf(Date);
    }
  });

  it('should prevent duplicate completions', async () => {
    // First completion should succeed (already created in previous test)
    const result = await recordTrainingCompletion(testUserId, testMaterialId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Training has already been completed by this user');
    }
  });

  it('should handle invalid user ID', async () => {
    const invalidUserId = 999999;
    const result = await recordTrainingCompletion(invalidUserId, testMaterialId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid user ID or material ID');
    }
  });

  it('should handle invalid material ID', async () => {
    const invalidMaterialId = 999999;
    const result = await recordTrainingCompletion(testUserId, invalidMaterialId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid user ID or material ID');
    }
  });

  it('should set synced to false by default', async () => {
    // Create a new user and material for this test
    const [newUser] = await db
      .insert(users)
      .values({
        email: 'test-synced@example.com',
      })
      .returning();

    const [newMaterial] = await db
      .insert(trainingMaterials)
      .values({
        title: 'Test Synced Material',
        content: 'Test content for sync check',
        categoryId: 'test-category',
      })
      .returning();

    const result = await recordTrainingCompletion(newUser.id, newMaterial.id);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.completion.synced).toBe(false);
      expect(result.completion.lastSyncedAt).toBeNull();
      expect(result.completion.remoteId).toBeNull();
    }

    // Clean up
    await db
      .delete(trainingCompletions)
      .where(
        and(
          eq(trainingCompletions.userId, newUser.id),
          eq(trainingCompletions.materialId, newMaterial.id)
        )
      );
    await db.delete(trainingMaterials).where(eq(trainingMaterials.id, newMaterial.id));
    await db.delete(users).where(eq(users.id, newUser.id));
  });
});
