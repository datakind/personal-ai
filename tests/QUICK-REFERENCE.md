# Property-Based Testing Quick Reference

## Import Everything You Need

```typescript
import fc from 'fast-check';
import {
  // Generators
  userIdArb,
  materialIdArb,
  categoryIdArb,
  titleArb,
  contentArb,
  timestampArb,
  emailArb,
  trainingMaterialArb,
  completionDataArb,
  
  // Test Context
  createTestContext,
  
  // Query Helpers
  countUserCompletions,
  countMaterialCompletions,
  completionExists,
  verifyDescendingTimestampOrder,
  verifyTimestampRecent,
} from './training-test-helpers';
```

## Basic Test Pattern

```typescript
async function testMyProperty() {
  const ctx = await createTestContext();
  
  try {
    // 1. Create test data
    const user = await ctx.createUser();
    const material = await ctx.createMaterial();
    
    // 2. Execute operation
    const result = await someOperation(user.id, material.id);
    
    // 3. Assert property holds
    if (!result.success) {
      throw new Error('Property violated');
    }
    
    // 4. Verify additional conditions
    const count = await countUserCompletions(user.id);
    if (count !== 1) {
      throw new Error('Expected exactly 1 completion');
    }
    
  } finally {
    // 5. Always cleanup
    await ctx.cleanup();
  }
}
```

## Using fast-check for Multiple Runs

```typescript
// Run test 100 times with random data
await fc.assert(
  fc.asyncProperty(
    userIdArb,
    materialIdArb,
    async (randomUserId, randomMaterialId) => {
      const ctx = await createTestContext();
      try {
        // Create real entities (don't use random IDs directly)
        const user = await ctx.createUser();
        const material = await ctx.createMaterial();
        
        // Test property
        const result = await operation(user.id, material.id);
        return result.success === true;
        
      } finally {
        await ctx.cleanup();
      }
    }
  ),
  { numRuns: 100 }
);
```

## Common Assertions

```typescript
// Count assertions
const count = await countUserCompletions(userId);
if (count !== expectedCount) {
  throw new Error(`Expected ${expectedCount} completions, got ${count}`);
}

// Existence assertions
const exists = await completionExists(userId, materialId);
if (!exists) {
  throw new Error('Completion should exist');
}

// Ordering assertions
const completions = await getUserCompletionHistory(userId);
if (!verifyDescendingTimestampOrder(completions)) {
  throw new Error('Completions not in descending order');
}

// Timestamp assertions
if (!verifyTimestampRecent(completion.completedAt, 5)) {
  throw new Error('Timestamp not within 5 seconds of now');
}
```

## Test Context Methods

```typescript
const ctx = await createTestContext();

// Create entities (automatically tracked for cleanup)
const user = await ctx.createUser('optional@email.com');
const material = await ctx.createMaterial({
  title: 'Optional title',
  content: 'Optional content',
  categoryId: 'optional-category',
});
const completion = await ctx.createCompletion(userId, materialId, {
  synced: true,
  remoteId: 'remote-123',
  completedAt: new Date(),
});

// Cleanup (call in finally block)
await ctx.cleanup();
```

## Running Tests

```bash
# Run example test
npx tsx tests/training-properties-example.test.ts

# Run your property tests (once created)
npx tsx tests/training-properties.test.ts

# Run specific test file
npx tsx tests/your-test-file.test.ts
```

## Common Patterns

### Test Duplicate Prevention

```typescript
const ctx = await createTestContext();
try {
  const user = await ctx.createUser();
  const material = await ctx.createMaterial();
  
  // First completion should succeed
  const result1 = await recordTrainingCompletion(user.id, material.id);
  if (!result1.success) throw new Error('First completion should succeed');
  
  // Second completion should fail
  const result2 = await recordTrainingCompletion(user.id, material.id);
  if (result2.success) throw new Error('Duplicate should be prevented');
  
  // Verify only one completion exists
  const count = await countUserCompletions(user.id);
  if (count !== 1) throw new Error('Should have exactly 1 completion');
  
} finally {
  await ctx.cleanup();
}
```

### Test Cascade Delete

```typescript
const ctx = await createTestContext();
try {
  const user = await ctx.createUser();
  const materials = await Promise.all([
    ctx.createMaterial(),
    ctx.createMaterial(),
    ctx.createMaterial(),
  ]);
  
  // Create completions
  for (const material of materials) {
    await ctx.createCompletion(user.id, material.id);
  }
  
  // Verify completions exist
  const countBefore = await countUserCompletions(user.id);
  if (countBefore !== 3) throw new Error('Should have 3 completions');
  
  // Delete user (should cascade delete completions)
  await deleteTestUser(user.id);
  
  // Verify completions are gone
  const countAfter = await countUserCompletions(user.id);
  if (countAfter !== 0) throw new Error('Completions should be deleted');
  
} finally {
  await ctx.cleanup();
}
```

### Test Foreign Key Enforcement

```typescript
const ctx = await createTestContext();
try {
  const material = await ctx.createMaterial();
  const invalidUserId = 999999;
  
  // Should fail with foreign key error
  const result = await recordTrainingCompletion(invalidUserId, material.id);
  
  if (result.success) {
    throw new Error('Should fail with invalid user ID');
  }
  
  if (!result.error.includes('Invalid user ID')) {
    throw new Error('Should return foreign key error message');
  }
  
} finally {
  await ctx.cleanup();
}
```

### Test Timestamp Ordering

```typescript
const ctx = await createTestContext();
try {
  const user = await ctx.createUser();
  const materials = await Promise.all([
    ctx.createMaterial(),
    ctx.createMaterial(),
    ctx.createMaterial(),
  ]);
  
  // Create completions with delays to ensure different timestamps
  for (const material of materials) {
    await ctx.createCompletion(user.id, material.id);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // Get completion history
  const history = await getUserCompletionHistory(user.id);
  
  // Verify descending order
  if (!verifyDescendingTimestampOrder(history)) {
    throw new Error('History not in descending order');
  }
  
} finally {
  await ctx.cleanup();
}
```

## Tips

- **Always use try/finally** - Ensures cleanup even if test fails
- **Create real entities** - Don't use random IDs directly; create actual DB records
- **Test one property** - Keep each test focused on a single correctness property
- **Use descriptive errors** - Make assertion failures easy to understand
- **Run many iterations** - Use `numRuns: 100` to discover edge cases

## Need Help?

See `tests/README-PROPERTY-TESTING.md` for detailed documentation.
