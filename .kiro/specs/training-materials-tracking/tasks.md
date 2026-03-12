# Implementation Plan: Training Materials Tracking

## Overview

This implementation adds two new database tables (`training_materials` and `training_completions`) to the existing SQLite schema using Drizzle ORM. The feature enables tracking which users have completed which training materials, with support for bidirectional sync metadata for future OAuth integration.

The implementation follows the existing patterns in `db/schema.ts` and integrates with the current user authentication system. All database operations will be type-safe using Drizzle's TypeScript inference.

## Tasks

- [ ] 1. Extend database schema with new tables and relations
  - [x] 1.1 Add training_materials table definition to db/schema.ts
    - Define table with id, title, content, categoryId, createdAt, updatedAt fields
    - Use existing timestamp patterns from users/sessions tables
    - Export TypeScript types using $inferSelect and $inferInsert
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.2, 8.3_
  
  - [x] 1.2 Add training_completions table definition to db/schema.ts
    - Define table with id, userId, materialId, completedAt, synced, lastSyncedAt, remoteId fields
    - Add foreign key references to users and training_materials with CASCADE delete
    - Add unique composite constraint on (userId, materialId)
    - Add indexes on userId, materialId, and synced fields
    - Export TypeScript types using $inferSelect and $inferInsert
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 8.2, 8.3_
  
  - [x] 1.3 Define relational mappings using Drizzle relations API
    - Create trainingMaterialsRelations with many completions
    - Create trainingCompletionsRelations with one user and one material
    - Extend existing usersRelations to include many trainingCompletions
    - _Requirements: 8.4_
  
  - [ ]* 1.4 Write property test for schema type exports
    - **Property: Type Safety Validation**
    - **Validates: Requirements 8.2, 8.3**
    - Verify exported types match table definitions
    - Test that insert types allow optional auto-generated fields

- [ ] 2. Generate and apply database migration
  - [x] 2.1 Generate migration file using Drizzle Kit
    - Run `npx drizzle-kit generate` to create migration SQL
    - Review generated SQL for correctness (foreign keys, indexes, constraints)
    - _Requirements: 1.1-1.6, 2.1-2.5, 5.1-5.4, 6.1-6.4_
  
  - [x] 2.2 Apply migration to database
    - Run migration using db/migrate.ts or equivalent
    - Verify tables created with correct schema
    - _Requirements: 1.1-1.6, 2.1-2.5_

- [ ] 3. Implement core completion tracking operations
  - [x] 3.1 Create function to record training completion
    - Implement insert operation for training_completions table
    - Handle duplicate completion attempts (catch unique constraint violation)
    - Set synced to false by default for new completions
    - Return created completion record or error
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 3.2 Write property tests for completion creation
    - **Property 1: Completion Record Creation**
    - **Validates: Requirements 2.1**
    - Test that created records can be retrieved with correct values
  
  - [ ]* 3.3 Write property test for duplicate prevention
    - **Property 2: Duplicate Completion Prevention**
    - **Validates: Requirements 2.5**
    - Test that second insert fails and only one record exists
  
  - [ ]* 3.4 Write property tests for foreign key enforcement
    - **Property 9: User Foreign Key Enforcement**
    - **Validates: Requirements 5.3**
    - Test that invalid user IDs fail with foreign key error
    - **Property 10: Material Foreign Key Enforcement**
    - **Validates: Requirements 5.4**
    - Test that invalid material IDs fail with foreign key error

- [ ] 4. Implement query functions for training history
  - [x] 4.1 Create function to get user's completion history
    - Use relational query API to fetch completions with material details
    - Order by completedAt descending (most recent first)
    - Return array of completions with joined material data
    - _Requirements: 3.1, 3.2_
  
  - [x] 4.2 Create function to check if user completed specific material
    - Query for completion record matching userId and materialId
    - Return boolean indicating existence
    - _Requirements: 3.4_
  
  - [x] 4.3 Create function to get all users who completed a material
    - Query completions by materialId with user details
    - Return array of completions with joined user data
    - _Requirements: 3.3_
  
  - [x] 4.4 Create function to get unsynced completions for user
    - Query completions where userId matches and synced is false
    - Include material details for sync payload
    - _Requirements: 4.3_
  
  - [ ]* 4.5 Write property tests for query operations
    - **Property 3: User Completion History Query**
    - **Validates: Requirements 3.1, 3.2**
    - Test exact count and descending timestamp order
    - **Property 4: Material Completion Query**
    - **Validates: Requirements 3.3**
    - Test exact count with distinct user IDs
    - **Property 5: Completion Existence Check**
    - **Validates: Requirements 3.4**
    - Test that existence check matches database state
    - **Property 6: Unsynced Completions Query**
    - **Validates: Requirements 4.3**
    - Test that only unsynced records are returned

- [ ] 5. Implement sync metadata operations
  - [x] 5.1 Create function to mark completion as synced
    - Update synced to true and set lastSyncedAt to current timestamp
    - Accept completion ID and optional remoteId
    - _Requirements: 4.1, 4.2_
  
  - [x] 5.2 Create function to create completion from remote sync
    - Insert completion with synced=true, remoteId, and lastSyncedAt set
    - Handle case where completion already exists locally
    - _Requirements: 4.4_

- [ ] 6. Implement training materials CRUD operations
  - [x] 6.1 Create function to insert training material
    - Insert into training_materials table
    - Validate required fields (title, content, categoryId)
    - Return created material record
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 6.2 Create function to update training material
    - Update material by ID
    - Verify updatedAt timestamp is automatically updated
    - _Requirements: 1.6_
  
  - [x] 6.3 Create function to delete training material
    - Delete material by ID
    - Verify cascade delete removes associated completions
    - _Requirements: 5.2_
  
  - [ ]* 6.4 Write property tests for materials operations
    - **Property 11: Automatic Creation Timestamp**
    - **Validates: Requirements 7.2**
    - Test createdAt is within 5 seconds of current time
    - **Property 12: Automatic Update Timestamp**
    - **Validates: Requirements 7.3**
    - Test updatedAt increases after update

- [ ] 7. Implement referential integrity tests
  - [ ]* 7.1 Write property test for user deletion cascade
    - **Property 7: User Deletion Cascade**
    - **Validates: Requirements 5.1**
    - Test that deleting user removes all completion records
  
  - [ ]* 7.2 Write property test for material deletion cascade
    - **Property 8: Material Deletion Cascade**
    - **Validates: Requirements 5.2**
    - Test that deleting material removes all completion records

- [ ] 8. Implement timestamp query operations
  - [x] 8.1 Create function to query completions by timestamp range
    - Accept start and end timestamps
    - Return completions where completedAt falls within range
    - _Requirements: 7.4_
  
  - [ ]* 8.2 Write property test for timestamp range queries
    - **Property 13: Timestamp Range Query**
    - **Validates: Requirements 7.4**
    - Test that all returned records fall within specified range

- [ ] 9. Create test infrastructure and utilities
  - [x] 9.1 Set up property-based testing with fast-check
    - Create custom generators for userIds, materialIds, categoryIds, titles, content
    - Create helper functions for test data setup and cleanup
    - Configure transaction-based test isolation
    - _Requirements: All (testing infrastructure)_
  
  - [x] 9.2 Create unit test files for core operations
    - Create tests/training-materials.test.ts for materials CRUD
    - Create tests/training-completions.test.ts for completions CRUD
    - Create tests/training-queries.test.ts for query patterns
    - _Requirements: All (testing infrastructure)_

- [x] 10. Final checkpoint - Verify implementation completeness
  - Run all tests to ensure correctness properties hold
  - Verify migration applied successfully
  - Verify all exported types are available
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- All database operations follow existing patterns in db/schema.ts for consistency
- Property tests use fast-check library (already in package.json)
- Each property test validates specific requirements from the design document
- Foreign key constraints with CASCADE delete ensure referential integrity
- Indexes on userId, materialId, and synced fields optimize query performance
- Sync metadata fields (synced, lastSyncedAt, remoteId) support future OAuth integration
