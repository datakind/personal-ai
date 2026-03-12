# Requirements Document

## Introduction

This feature adds database tables to store training materials and track which users have successfully completed which training materials. The system supports local user identification, optional OAuth integration, and bidirectional synchronization with a shared storage system when accounts are linked.

## Glossary

- **Training_System**: The application that delivers training materials to users
- **Training_Material**: A pre-created knowledge resource that can be delivered to users
- **User_Record**: A user account identified by an incrementing local ID with optional email
- **Completion_Record**: A record indicating a user has successfully completed a training material
- **Storage_System**: The external OAuth-based shared storage system for syncing training history
- **Linked_Account**: A User_Record that has been connected to the Storage_System via OAuth

## Requirements

### Requirement 1: Store Training Materials

**User Story:** As a system administrator, I want to store training materials in the database, so that they can be delivered to users.

#### Acceptance Criteria

1. THE Training_System SHALL store training materials with a unique identifier
2. THE Training_System SHALL store training material title
3. THE Training_System SHALL store training material content
4. THE Training_System SHALL store training material category identifier
5. THE Training_System SHALL store training material creation timestamp
6. THE Training_System SHALL store training material last updated timestamp

### Requirement 2: Track Training Completion

**User Story:** As the system, I want to track which users have completed which training materials, so that I can selectively present appropriate content.

#### Acceptance Criteria

1. WHEN a user successfully completes a training material, THE Training_System SHALL create a Completion_Record
2. THE Completion_Record SHALL reference the User_Record identifier
3. THE Completion_Record SHALL reference the Training_Material identifier
4. THE Completion_Record SHALL store the completion timestamp
5. THE Training_System SHALL prevent duplicate Completion_Records for the same user and training material combination

### Requirement 3: Query User Training History

**User Story:** As a developer, I want to query a user's training history, so that I can determine which materials to present next.

#### Acceptance Criteria

1. WHEN querying for a specific user, THE Training_System SHALL return all Completion_Records for that user
2. THE Training_System SHALL return Completion_Records ordered by completion timestamp
3. WHEN querying for a specific training material, THE Training_System SHALL return all users who completed it
4. THE Training_System SHALL support querying whether a specific user has completed a specific training material

### Requirement 4: Support Bidirectional Sync Metadata

**User Story:** As the system, I want to track synchronization state with the external storage system, so that I can maintain consistency between local and remote records.

#### Acceptance Criteria

1. WHERE a User_Record is a Linked_Account, THE Training_System SHALL track whether each Completion_Record has been synced to the Storage_System
2. THE Training_System SHALL store the last sync timestamp for each Completion_Record
3. THE Training_System SHALL support querying unsynced Completion_Records for a specific user
4. WHERE a Completion_Record originates from the Storage_System, THE Training_System SHALL store the remote record identifier

### Requirement 5: Maintain Referential Integrity

**User Story:** As a database administrator, I want referential integrity constraints, so that the data remains consistent.

#### Acceptance Criteria

1. WHEN a User_Record is deleted, THE Training_System SHALL delete all associated Completion_Records
2. WHEN a Training_Material is deleted, THE Training_System SHALL delete all associated Completion_Records
3. THE Training_System SHALL enforce foreign key constraints between Completion_Records and User_Records
4. THE Training_System SHALL enforce foreign key constraints between Completion_Records and Training_Materials

### Requirement 6: Support Efficient Queries

**User Story:** As a developer, I want efficient database queries, so that the application performs well at scale.

#### Acceptance Criteria

1. THE Training_System SHALL create an index on the user identifier in Completion_Records
2. THE Training_System SHALL create an index on the training material identifier in Completion_Records
3. THE Training_System SHALL create a unique composite index on user identifier and training material identifier in Completion_Records
4. THE Training_System SHALL create an index on the sync status field for querying unsynced records

### Requirement 7: Store Timestamps Consistently

**User Story:** As a developer, I want consistent timestamp handling, so that time-based queries work correctly.

#### Acceptance Criteria

1. THE Training_System SHALL store all timestamps as Unix epoch integers
2. WHEN creating a new record, THE Training_System SHALL automatically set the creation timestamp to the current time
3. WHEN updating a record, THE Training_System SHALL automatically update the last modified timestamp
4. THE Training_System SHALL support querying records by timestamp ranges

### Requirement 8: Type Safety with Drizzle ORM

**User Story:** As a developer, I want type-safe database operations, so that I catch errors at compile time.

#### Acceptance Criteria

1. THE Training_System SHALL define database schemas using Drizzle ORM TypeScript definitions
2. THE Training_System SHALL export TypeScript types for select operations on all tables
3. THE Training_System SHALL export TypeScript types for insert operations on all tables
4. THE Training_System SHALL define relational mappings between tables using Drizzle relations API
