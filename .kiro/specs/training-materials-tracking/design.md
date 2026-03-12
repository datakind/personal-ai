# Design Document: Training Materials Tracking

## Overview

This feature extends the existing database schema to support training materials storage and completion tracking. The design introduces two new tables: `training_materials` for storing training content and `training_completions` for tracking which users have completed which materials.

The system supports both standalone operation (local-only tracking) and synchronized operation (bidirectional sync with external OAuth-based storage). The design prioritizes type safety through Drizzle ORM, efficient querying through strategic indexing, and data integrity through foreign key constraints with cascading deletes.

Key design principles:
- Type-safe database operations using Drizzle ORM's TypeScript inference
- Efficient queries through composite indexes on frequently-accessed columns
- Data consistency through foreign key constraints and unique constraints
- Unix epoch timestamps for consistent time handling across systems
- Support for bidirectional sync metadata without coupling to sync implementation

## Architecture

### Database Layer

The feature adds two new tables to the existing SQLite database:

1. **training_materials**: Stores training content with metadata
2. **training_completions**: Junction table tracking user-material completion relationships

Both tables integrate with the existing `users` table through foreign key relationships. The design follows the established patterns in `db/schema.ts` for consistency with the existing codebase.

### Data Flow

```
User completes training
    ↓
Create completion record (local)
    ↓
Mark as unsynced (if user has linked account)
    ↓
[External sync process reads unsynced records]
    ↓
Update sync status after successful sync
```

For linked accounts on sign-in:
```
User signs in
    ↓
[External sync process queries remote storage]
    ↓
Create local completion records with remote IDs
    ↓
Mark as synced
```

### Integration Points

- **Existing users table**: Foreign key relationship for completion tracking
- **Server Actions**: Will use these tables for CRUD operations
- **Sync service** (future): Will query unsynced records and update sync metadata

## Components and Interfaces

### Database Schema

#### Training Materials Table

```typescript
export const trainingMaterials = sqliteTable('training_materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  categoryId: text('category_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
```

#### Training Completions Table

```typescript
export const trainingCompletions = sqliteTable('training_completions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  materialId: integer('material_id')
    .notNull()
    .references(() => trainingMaterials.id, { onDelete: 'cascade' }),
  completedAt: integer('completed_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  synced: integer('synced', { mode: 'boolean' })
    .notNull()
    .default(false),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
  remoteId: text('remote_id'),
}, (table) => [
  // Unique constraint: one completion per user-material pair
  unique('user_material_unique').on(table.userId, table.materialId),
  // Index for querying by user
  index('completions_user_idx').on(table.userId),
  // Index for querying by material
  index('completions_material_idx').on(table.materialId),
  // Index for querying unsynced records
  index('completions_synced_idx').on(table.synced),
]);
```

### Relations

```typescript
export const trainingMaterialsRelations = relations(trainingMaterials, ({ many }) => ({
  completions: many(trainingCompletions),
}));

export const trainingCompletionsRelations = relations(trainingCompletions, ({ one }) => ({
  user: one(users, {
    fields: [trainingCompletions.userId],
    references: [users.id],
  }),
  material: one(trainingMaterials, {
    fields: [trainingCompletions.materialId],
    references: [trainingMaterials.id],
  }),
}));

// Extend existing users relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  trainingCompletions: many(trainingCompletions),
}));
```

### Type Exports

```typescript
export type TrainingMaterial = typeof trainingMaterials.$inferSelect;
export type NewTrainingMaterial = typeof trainingMaterials.$inferInsert;
export type TrainingCompletion = typeof trainingCompletions.$inferSelect;
export type NewTrainingCompletion = typeof trainingCompletions.$inferInsert;
```

### Query Patterns

#### Get User's Completion History

```typescript
// Using relational query API
const userCompletions = await db.query.trainingCompletions.findMany({
  where: (completions, { eq }) => eq(completions.userId, userId),
  orderBy: (completions, { desc }) => [desc(completions.completedAt)],
  with: {
    material: true,
  },
});
```

#### Check if User Completed Material

```typescript
const completion = await db.query.trainingCompletions.findFirst({
  where: (completions, { eq, and }) => and(
    eq(completions.userId, userId),
    eq(completions.materialId, materialId)
  ),
});

const hasCompleted = completion !== undefined;
```

#### Get Unsynced Completions for User

```typescript
const unsyncedCompletions = await db.query.trainingCompletions.findMany({
  where: (completions, { eq, and }) => and(
    eq(completions.userId, userId),
    eq(completions.synced, false)
  ),
  with: {
    material: true,
  },
});
```

#### Get All Users Who Completed a Material

```typescript
const completions = await db.query.trainingCompletions.findMany({
  where: (completions, { eq }) => eq(completions.materialId, materialId),
  with: {
    user: true,
  },
});
```

## Data Models

### Training Material

Represents a pre-created training resource that can be delivered to users.

**Fields:**
- `id`: Auto-incrementing primary key
- `title`: Human-readable title for the training material
- `content`: The actual training content (text, could be markdown, HTML, etc.)
- `categoryId`: Identifier for grouping related materials (string for flexibility)
- `createdAt`: Unix epoch timestamp, auto-set on creation
- `updatedAt`: Unix epoch timestamp, auto-updated on modification

**Constraints:**
- Primary key on `id`
- `title`, `content`, and `categoryId` are required (NOT NULL)

### Training Completion

Represents a record that a specific user has successfully completed a specific training material.

**Fields:**
- `id`: Auto-incrementing primary key
- `userId`: Foreign key to users table
- `materialId`: Foreign key to training_materials table
- `completedAt`: Unix epoch timestamp when completion occurred
- `synced`: Boolean flag indicating if record has been synced to remote storage
- `lastSyncedAt`: Unix epoch timestamp of last successful sync (nullable)
- `remoteId`: Identifier from remote storage system (nullable)

**Constraints:**
- Primary key on `id`
- Foreign key `userId` references `users.id` with CASCADE delete
- Foreign key `materialId` references `training_materials.id` with CASCADE delete
- Unique composite constraint on `(userId, materialId)` - prevents duplicate completions
- Index on `userId` for efficient user history queries
- Index on `materialId` for efficient material completion queries
- Index on `synced` for efficient unsynced record queries

**Sync Metadata:**
- `synced`: Defaults to `false`, set to `true` after successful sync
- `lastSyncedAt`: Updated each time sync succeeds
- `remoteId`: Populated when record originates from remote storage or after first sync

### Referential Integrity

The design enforces referential integrity through foreign key constraints:

1. **User deletion**: When a user is deleted, all their completion records are automatically deleted (CASCADE)
2. **Material deletion**: When a training material is deleted, all completion records for that material are automatically deleted (CASCADE)

This ensures no orphaned records exist in the database and maintains data consistency.

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Completion Record Creation

*For any* valid user ID and material ID, when a completion is created, the system should successfully store a completion record that can be retrieved with matching user ID, material ID, and a completion timestamp.

**Validates: Requirements 2.1**

### Property 2: Duplicate Completion Prevention

*For any* user-material pair, attempting to create a second completion record for the same combination should fail, and the database should contain exactly one completion record for that pair.

**Validates: Requirements 2.5**

### Property 3: User Completion History Query

*For any* user with N completion records, querying for that user's completion history should return exactly N records, ordered by completion timestamp in descending order (most recent first).

**Validates: Requirements 3.1, 3.2**

### Property 4: Material Completion Query

*For any* training material with N completion records, querying for users who completed that material should return exactly N completion records with distinct user IDs.

**Validates: Requirements 3.3**

### Property 5: Completion Existence Check

*For any* user-material pair, querying whether the user has completed the material should return true if and only if a completion record exists for that exact pair.

**Validates: Requirements 3.4**

### Property 6: Unsynced Completions Query

*For any* user with N unsynced completion records (synced = false), querying for unsynced completions should return exactly those N records and exclude any synced completions.

**Validates: Requirements 4.3**

### Property 7: User Deletion Cascade

*For any* user with N completion records, deleting the user should result in all N completion records being automatically deleted, leaving zero completion records referencing that user ID.

**Validates: Requirements 5.1**

### Property 8: Material Deletion Cascade

*For any* training material with N completion records, deleting the material should result in all N completion records being automatically deleted, leaving zero completion records referencing that material ID.

**Validates: Requirements 5.2**

### Property 9: User Foreign Key Enforcement

*For any* non-existent user ID, attempting to create a completion record with that user ID should fail with a foreign key constraint violation.

**Validates: Requirements 5.3**

### Property 10: Material Foreign Key Enforcement

*For any* non-existent material ID, attempting to create a completion record with that material ID should fail with a foreign key constraint violation.

**Validates: Requirements 5.4**

### Property 11: Automatic Creation Timestamp

*For any* newly created training material or completion record, the creation timestamp should be automatically set and should be within a reasonable delta (e.g., 5 seconds) of the current time.

**Validates: Requirements 7.2**

### Property 12: Automatic Update Timestamp

*For any* training material record, when the record is updated, the updatedAt timestamp should change to reflect a time greater than or equal to the previous updatedAt value.

**Validates: Requirements 7.3**

### Property 13: Timestamp Range Query

*For any* timestamp range [start, end], querying completion records within that range should return only records where completedAt falls within the range (start ≤ completedAt ≤ end).

**Validates: Requirements 7.4**

## Error Handling

### Database Constraint Violations

**Duplicate Completion Attempts:**
- Error: SQLite UNIQUE constraint violation
- Handling: Catch the error and return a meaningful message to the caller
- User experience: Inform that the training has already been completed

**Foreign Key Violations:**
- Error: SQLite FOREIGN KEY constraint violation
- Handling: Catch the error and validate that referenced records exist
- User experience: Inform that the user or material does not exist

**NULL Constraint Violations:**
- Error: SQLite NOT NULL constraint violation
- Handling: Validate required fields before database operations
- User experience: Inform which required fields are missing

### Query Errors

**Invalid User/Material IDs:**
- Validation: Check that IDs are positive integers
- Response: Return empty results for non-existent records
- Logging: Log invalid ID attempts for debugging

**Database Connection Errors:**
- Error: Database file locked or connection failed
- Handling: Retry with exponential backoff (for writes)
- User experience: Display temporary error message, suggest retry

### Sync-Related Errors

**Sync Timestamp Updates:**
- Scenario: Sync process fails after partial completion
- Handling: Use transactions to ensure atomic updates
- Recovery: Unsynced records remain queryable for retry

**Remote ID Conflicts:**
- Scenario: Remote ID already exists for different local record
- Handling: Log conflict and require manual resolution
- Prevention: Validate remote IDs before insertion

## Testing Strategy

### Unit Testing Approach

Unit tests will focus on specific examples, edge cases, and integration points:

**Example-Based Tests:**
- Creating a completion with valid data succeeds
- Querying an empty completion history returns empty array
- Deleting a non-existent user succeeds without error
- Creating a material with all required fields succeeds

**Edge Cases:**
- Empty string values for title, content, categoryId
- Very long content strings (test text field limits)
- Timestamp boundary values (year 2038 problem for 32-bit systems)
- Concurrent completion attempts for same user-material pair

**Integration Tests:**
- Relational queries return properly joined data
- Cascading deletes work across multiple levels
- Indexes improve query performance (measure query time)
- Transaction rollback on constraint violations

### Property-Based Testing Approach

Property-based tests will verify universal properties across randomized inputs using the `fast-check` library (already in package.json). Each test will run a minimum of 100 iterations.

**Test Configuration:**
```typescript
import fc from 'fast-check';

// Example property test structure
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 10000 }), // userId
    fc.integer({ min: 1, max: 1000 }),  // materialId
    async (userId, materialId) => {
      // Test property
    }
  ),
  { numRuns: 100 }
);
```

**Property Test Coverage:**

Each correctness property from the design document will be implemented as a property-based test:

1. **Property 1 - Completion Record Creation**
   - Tag: `Feature: training-materials-tracking, Property 1: Completion Record Creation`
   - Generators: Random user IDs, material IDs
   - Assertion: Created record can be retrieved with correct values

2. **Property 2 - Duplicate Completion Prevention**
   - Tag: `Feature: training-materials-tracking, Property 2: Duplicate Completion Prevention`
   - Generators: Random user-material pairs
   - Assertion: Second insert fails, only one record exists

3. **Property 3 - User Completion History Query**
   - Tag: `Feature: training-materials-tracking, Property 3: User Completion History Query`
   - Generators: Random user ID, random number of completions
   - Assertion: Query returns exact count, ordered by timestamp descending

4. **Property 4 - Material Completion Query**
   - Tag: `Feature: training-materials-tracking, Property 4: Material Completion Query`
   - Generators: Random material ID, random number of users
   - Assertion: Query returns exact count with distinct user IDs

5. **Property 5 - Completion Existence Check**
   - Tag: `Feature: training-materials-tracking, Property 5: Completion Existence Check`
   - Generators: Random user-material pairs, some with completions, some without
   - Assertion: Existence check matches actual database state

6. **Property 6 - Unsynced Completions Query**
   - Tag: `Feature: training-materials-tracking, Property 6: Unsynced Completions Query`
   - Generators: Random user ID, mix of synced/unsynced completions
   - Assertion: Query returns only unsynced records

7. **Property 7 - User Deletion Cascade**
   - Tag: `Feature: training-materials-tracking, Property 7: User Deletion Cascade`
   - Generators: Random user ID with random number of completions
   - Assertion: After user deletion, completion count is zero

8. **Property 8 - Material Deletion Cascade**
   - Tag: `Feature: training-materials-tracking, Property 8: Material Deletion Cascade`
   - Generators: Random material ID with random number of completions
   - Assertion: After material deletion, completion count is zero

9. **Property 9 - User Foreign Key Enforcement**
   - Tag: `Feature: training-materials-tracking, Property 9: User Foreign Key Enforcement`
   - Generators: Random non-existent user IDs, valid material IDs
   - Assertion: Insert fails with foreign key error

10. **Property 10 - Material Foreign Key Enforcement**
    - Tag: `Feature: training-materials-tracking, Property 10: Material Foreign Key Enforcement`
    - Generators: Valid user IDs, random non-existent material IDs
    - Assertion: Insert fails with foreign key error

11. **Property 11 - Automatic Creation Timestamp**
    - Tag: `Feature: training-materials-tracking, Property 11: Automatic Creation Timestamp`
    - Generators: Random material/completion data
    - Assertion: createdAt is within 5 seconds of current time

12. **Property 12 - Automatic Update Timestamp**
    - Tag: `Feature: training-materials-tracking, Property 12: Automatic Update Timestamp`
    - Generators: Random material updates
    - Assertion: updatedAt increases after update

13. **Property 13 - Timestamp Range Query**
    - Tag: `Feature: training-materials-tracking, Property 13: Timestamp Range Query`
    - Generators: Random timestamp ranges, random completions
    - Assertion: All returned records fall within range

**Test Data Management:**

Property tests will use transactions with rollback to ensure test isolation:

```typescript
await db.transaction(async (tx) => {
  // Create test data
  // Run property test
  // Rollback happens automatically if test fails
  tx.rollback(); // Explicit rollback for cleanup
});
```

**Generators:**

Custom generators will be created for domain objects:

```typescript
const userIdArb = fc.integer({ min: 1, max: 10000 });
const materialIdArb = fc.integer({ min: 1, max: 1000 });
const categoryIdArb = fc.string({ minLength: 1, maxLength: 50 });
const titleArb = fc.string({ minLength: 1, maxLength: 200 });
const contentArb = fc.string({ minLength: 1, maxLength: 5000 });
const timestampArb = fc.date().map(d => Math.floor(d.getTime() / 1000));
```

### Test Organization

```
tests/
├── training-materials.test.ts          # Unit tests for materials CRUD
├── training-completions.test.ts        # Unit tests for completions CRUD
├── training-queries.test.ts            # Unit tests for query patterns
├── training-properties.test.ts         # Property-based tests (all 13 properties)
└── training-integration.test.ts        # Integration tests with existing features
```

### Performance Testing

While not part of the correctness properties, performance tests should verify:
- Index effectiveness: Queries with indexes vs without
- Large dataset handling: 10,000+ completions per user
- Concurrent operations: Multiple simultaneous completions

These tests ensure the system meets the "efficient queries" requirement (Requirement 6).
