# Legacy User Migration Guide

This document describes the process for migrating users from the legacy incrementing identifier system to the new email-based authentication system.

## Overview

The migration script (`scripts/migrate-legacy-users.ts`) converts existing users with incrementing identifiers to the new User_Record format while preserving all data associations:

- Training history records
- OAuth tokens
- User creation timestamps
- Referential integrity

## Migration Process

### 1. Prerequisites

Ensure you have:
- A backup of your database
- The legacy tables in your database:
  - `legacy_users` (id, created_at)
  - `legacy_training_history` (id, user_id, training_id, completed_at)
  - `legacy_oauth_tokens` (id, user_id, access_token, refresh_token, expires_at, created_at)

### 2. Running the Migration

```bash
# Run migration on default database (training.db)
npm run migrate:legacy-users

# Run migration on specific database
npm run migrate:legacy-users /path/to/database.db
```

### 3. What Happens During Migration

1. **Check for Legacy Tables**: Script verifies legacy tables exist
2. **Read Legacy Data**: Loads all users, training history, and OAuth tokens
3. **Transaction-Based Migration**: All operations wrapped in a transaction
4. **User Creation**: Creates new user records with:
   - Preserved user IDs
   - Placeholder emails (format: `migrated_user_{id}@migration.local`)
   - Original creation timestamps
5. **Association Preservation**: Training history and OAuth tokens maintain their user_id references
6. **Rollback on Error**: Any error triggers complete rollback

### 4. Post-Migration User Experience

When migrated users first access the application:

1. They authenticate with their session (if they have one) or login
2. System detects placeholder email address
3. User is redirected to `/email-prompt` page
4. User provides their real email address
5. Email is validated and checked for uniqueness
6. User record is updated with real email
7. User is redirected to dashboard or original destination

### 5. Email Prompt Flow

The email prompt mechanism:
- Detects emails matching pattern: `migrated_user_*@migration.local`
- Validates email format using standard regex
- Ensures email uniqueness across all users
- Updates user record atomically
- Preserves all existing associations

## Testing the Migration

### Create Test Legacy Data

```bash
# Create sample legacy data for testing
npm run test:create-legacy-data
```

This creates:
- 3 legacy users with different creation dates
- 5 training history records
- 2 OAuth token records

### Verify Migration

After running the migration:

```bash
# Check migrated users
sqlite3 training.db "SELECT id, email, created_at FROM users;"

# Verify training history associations
sqlite3 training.db "SELECT * FROM legacy_training_history;"

# Verify OAuth token associations
sqlite3 training.db "SELECT * FROM legacy_oauth_tokens;"
```

## Migration Script Details

### Transaction Safety

The migration uses SQLite transactions to ensure atomicity:
- All operations succeed together, or all fail together
- No partial migrations
- Database remains consistent even if errors occur

### ID Preservation

User IDs are preserved during migration:
- Legacy user ID 1 becomes new user ID 1
- Maintains referential integrity with training history
- Maintains referential integrity with OAuth tokens
- No need to update foreign key references

### Placeholder Email Format

Migrated users receive placeholder emails:
- Format: `migrated_user_{id}@migration.local`
- Easily identifiable by the system
- Unique per user
- Replaced when user provides real email

## Error Handling

The migration script handles various error scenarios:

1. **No Legacy Tables**: Exits gracefully with success
2. **No Legacy Users**: Exits gracefully with success
3. **Database Errors**: Rolls back transaction and reports error
4. **Constraint Violations**: Rolls back transaction and reports error

## Idempotency

The migration script is **not** idempotent by default:
- Running twice will attempt to insert duplicate user IDs
- This will fail due to primary key constraints
- To re-run migration, first delete migrated users or restore from backup

## Security Considerations

1. **Placeholder Emails**: Not valid for external communication
2. **Email Validation**: Real emails validated on collection
3. **Uniqueness**: System prevents duplicate email addresses
4. **Session Security**: Existing session security applies to migrated users

## Troubleshooting

### Migration Fails with "UNIQUE constraint failed"

This means users already exist in the new schema. Either:
- Migration already ran successfully
- Manual cleanup needed before re-running

### Users Not Prompted for Email

Check that:
- User email matches placeholder pattern
- `requireSession()` is called with `checkEmailPrompt: true` (default)
- Email prompt page is accessible at `/email-prompt`

### Training History Not Associated

Verify:
- Legacy training history table has correct `user_id` foreign keys
- User IDs were preserved during migration
- Foreign key constraints are enabled in SQLite

## Requirements Validation

This migration implementation satisfies:

- **Requirement 6.1**: Converts existing user identifiers to User_Record entries
- **Requirement 6.2**: Preserves association with training history
- **Requirement 6.3**: Preserves association with OAuth tokens
- **Requirement 6.4**: Prompts migrated users for email on first access
- **Requirement 6.5**: Maintains referential integrity with existing records
