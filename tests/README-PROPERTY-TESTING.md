# Property-Based Testing Infrastructure

This directory contains the property-based testing infrastructure for the Training Materials Tracking feature using the `fast-check` library.

## Overview

Property-based testing verifies that universal properties hold true across many randomized inputs, complementing traditional example-based unit tests. This approach helps discover edge cases and ensures correctness across the entire input space.

## Files

- **`training-test-helpers.ts`** - Core infrastructure with generators, helpers, and utilities
- **`training-properties-example.test.ts`** - Example demonstrating how to use the infrastructure
- **`training-properties.test.ts`** - (To be created) Full property test suite for all 13 correctness properties

## Quick Start

### Running the Example Test

```bash
npx tsx tests/training-properties-example.test.ts
```

This demonstrates:
- How to use fast-check generators
- How to create test contexts with automatic cleanup
- How to write a simple property test

## Available Generators

All generators are exported from `training-test-helpers.ts`:

### Basic Generators

```typescript
import {
  userIdArb,        // Generates user IDs (1-10,000)
  materialIdArb,    // Generates material IDs (1-1,000)
  categoryIdArb,    // Generates category IDs (1-50 chars)
  titleArb,         // Generates titles (1-200 chars)
  contentArb,       // Generates content (1-5,000 chars)
  timestampArb,     // Generates Unix epoch timestamps
  emailArb,         // Generates email addresses
  booleanArb,       // Generates boolean values
  remoteIdArb,      // Generates optional remote IDs
} from './training-test-helpers';
```

### Composite Generators

```typescript
import {
  trainingMaterialArb,  // Generates complete material objects
  completionDataArb,    // Generates completion record data
} from './training-test-helpers';
```

### Example Usage with fast-check

```typescript
import fc from 'fast-check';
import { userIdArb, materialIdArb } from './training-test-helpers';

// Generate random test data
const randomUserId = fc.sample(userIdArb, 1)[0];
const randomMaterialIds = fc.sample(materialIdArb, 5);

// Use in property tests
fc.assert(
  fc.property(
    userIdArb,
    materialIdArb,
    async (userId, materialId) => {
      // Test property here
    }
  ),
  { numRuns: 100 }
);
```

## Test Data Creation Helpers

### Creating Test Entities

```typescript
import {
  createTestUser,
  createTestUsers,
  createTestMaterial,
  createTestMaterials,
  createTestCompletion,
  createTestCompletions,
} from './training-test-helpers';

// Create single entities
const user = await createTestUser('test@example.com');
const material = await createTestMaterial({
  title: 'Test Material',
  content: 'Test content',
  categoryId: 'test-category',
});
const completion = await createTestCompletion(user.id, material.id);

// Create multiple entities
const users = await createTestUsers(5);
const materials = await createTestMaterials(10);
const completions = await createTestCompletions(
  user.id,
  materials.map(m => m.id)
);
```

### Cleaning Up Test Data

```typescript
import {
  deleteTestUser,
  deleteTestUsers,
  deleteTestMaterial,
  deleteTestMaterials,
  deleteTestCompletion,
  deleteTestCompletions,
  deleteUserCompletions,
  deleteMaterialCompletions,
  cleanupAllTrainingData,
} from './training-test-helpers';

// Delete specific entities
await deleteTestUser(userId);
await deleteTestMaterial(materialId);

// Delete multiple entities
await deleteTestUsers([userId1, userId2]);
await deleteTestMaterials([materialId1, materialId2]);

// Delete all completions for a user or material
await deleteUserCompletions(userId);
await deleteMaterialCompletions(materialId);

// Nuclear option: delete ALL training data (use with caution!)
await cleanupAllTrainingData();
```

## Test Context Pattern (Recommended)

The test context pattern provides automatic cleanup and is the recommended approach:

```typescript
import { createTestContext } from './training-test-helpers';

async function myPropertyTest() {
  const ctx = await createTestContext();
  
  try {
    // Create test data - automatically tracked for cleanup
    const user = await ctx.createUser();
    const material = await ctx.createMaterial();
    const completion = await ctx.createCompletion(user.id, material.id);
    
    // Run your test assertions here
    // ...
    
  } finally {
    // Cleanup happens automatically
    await ctx.cleanup();
  }
}
```

## Query Helpers

Helpers for verifying test results:

```typescript
import {
  countUserCompletions,
  countMaterialCompletions,
  countUnsyncedCompletions,
  completionExists,
  getDistinctUserIds,
  verifyDescendingTimestampOrder,
  verifyTimestampRecent,
} from './training-test-helpers';

// Count completions
const userCompletionCount = await countUserCompletions(userId);
const materialCompletionCount = await countMaterialCompletions(materialId);
const unsyncedCount = await countUnsyncedCompletions(userId);

// Check existence
const exists = await completionExists(userId, materialId);

// Get distinct user IDs who completed a material
const userIds = await getDistinctUserIds(materialId);

// Verify ordering and timestamps
const isOrdered = verifyDescendingTimestampOrder(completions);
const isRecent = verifyTimestampRecent(timestamp, 5); // Within 5 seconds
```

## Writing Property Tests

### Basic Structure

```typescript
import fc from 'fast-check';
import { createTestContext, userIdArb, materialIdArb } from './training-test-helpers';
import { recordTrainingCompletion } from '@/lib/training';

async function testCompletionProperty() {
  const ctx = await createTestContext();
  
  try {
    // Create real test entities
    const user = await ctx.createUser();
    const material = await ctx.createMaterial();
    
    // Test the property
    const result = await recordTrainingCompletion(user.id, material.id);
    
    // Assert the property holds
    if (!result.success) {
      throw new Error('Property violated: completion should succeed');
    }
    
    // Verify additional properties
    if (result.completion.userId !== user.id) {
      throw new Error('Property violated: userId should match');
    }
    
  } finally {
    await ctx.cleanup();
  }
}
```

### Using fc.assert for Multiple Runs

```typescript
import fc from 'fast-check';

// Run property test 100 times with random inputs
await fc.assert(
  fc.asyncProperty(
    userIdArb,
    materialIdArb,
    async (userId, materialId) => {
      // Note: You still need to create real DB entities
      // The generators just provide random IDs for testing
      const ctx = await createTestContext();
      try {
        const user = await ctx.createUser();
        const material = await ctx.createMaterial();
        
        // Test your property
        const result = await recordTrainingCompletion(user.id, material.id);
        return result.success === true;
        
      } finally {
        await ctx.cleanup();
      }
    }
  ),
  { numRuns: 100 }
);
```

## 13 Correctness Properties to Implement

Based on the design document, implement property tests for:

1. **Property 1: Completion Record Creation** - Validates Requirements 2.1
2. **Property 2: Duplicate Completion Prevention** - Validates Requirements 2.5
3. **Property 3: User Completion History Query** - Validates Requirements 3.1, 3.2
4. **Property 4: Material Completion Query** - Validates Requirements 3.3
5. **Property 5: Completion Existence Check** - Validates Requirements 3.4
6. **Property 6: Unsynced Completions Query** - Validates Requirements 4.3
7. **Property 7: User Deletion Cascade** - Validates Requirements 5.1
8. **Property 8: Material Deletion Cascade** - Validates Requirements 5.2
9. **Property 9: User Foreign Key Enforcement** - Validates Requirements 5.3
10. **Property 10: Material Foreign Key Enforcement** - Validates Requirements 5.4
11. **Property 11: Automatic Creation Timestamp** - Validates Requirements 7.2
12. **Property 12: Automatic Update Timestamp** - Validates Requirements 7.3
13. **Property 13: Timestamp Range Query** - Validates Requirements 7.4

Each property should be tagged with:
```typescript
// Tag: Feature: training-materials-tracking, Property N: [Property Name]
// Validates: Requirements X.Y
```

## Best Practices

1. **Always use test contexts** - Ensures cleanup happens even if tests fail
2. **Create real DB entities** - Don't mock; test against the actual database
3. **Run multiple iterations** - Use `fc.assert` with `numRuns: 100` or more
4. **Test edge cases** - Let fast-check discover edge cases you didn't think of
5. **Keep properties simple** - Each test should verify one clear property
6. **Clean up thoroughly** - Use the cleanup helpers to avoid test pollution

## Troubleshooting

### "UNIQUE constraint failed" errors

This usually means cleanup didn't run. Always use try/finally blocks:

```typescript
try {
  // test code
} finally {
  await ctx.cleanup();
}
```

### "FOREIGN KEY constraint failed" errors

Make sure you create parent entities (users, materials) before creating completions.

### Tests are slow

Property tests run many iterations. This is expected. You can reduce `numRuns` during development:

```typescript
fc.assert(property, { numRuns: 10 }); // Faster for development
fc.assert(property, { numRuns: 100 }); // Thorough for CI
```

## Next Steps

1. Review the example test: `training-properties-example.test.ts`
2. Create `training-properties.test.ts` with all 13 property tests
3. Run tests regularly during development
4. Add property tests to CI pipeline

## Resources

- [fast-check documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://github.com/dubzzz/fast-check/blob/main/documentation/Guides.md)
- Design document: `.kiro/specs/training-materials-tracking/design.md`
