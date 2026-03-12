# Scripts Directory

This directory contains utility scripts for database maintenance and migration.

## Available Scripts

### Session Cleanup

**File**: `cleanup-sessions.ts`

Removes expired sessions from the database to prevent accumulation of stale data.

```bash
npm run cleanup:sessions
```

**When to use**:
- Automatically runs on application startup
- Can be run manually for maintenance
- Should be scheduled to run daily in production

### Legacy User Migration

**File**: `migrate-legacy-users.ts`

Migrates users from the legacy incrementing identifier system to the new email-based authentication system.

```bash
# Run on default database
npm run migrate:legacy-users

# Run on specific database
npm run migrate:legacy-users /path/to/database.db
```

**Features**:
- Preserves user IDs
- Maintains training history associations
- Maintains OAuth token associations
- Transaction-based with automatic rollback on error
- Creates placeholder emails for migrated users

**Requirements**: 6.1, 6.2, 6.3, 6.4, 6.5

See [Migration Guide](../docs/MIGRATION.md) for detailed documentation.

### Create Test Legacy Data

**File**: `create-test-legacy-data.ts`

Creates sample legacy data for testing the migration process.

```bash
npm run test:create-legacy-data
```

**Creates**:
- 3 legacy users with different creation dates
- 5 training history records
- 2 OAuth token records

**When to use**:
- Testing migration script functionality
- Development and debugging
- Verifying migration behavior

## Migration Workflow

1. **Backup your database** (always!)
2. **Create test data** (optional, for testing):
   ```bash
   npm run test:create-legacy-data
   ```
3. **Run migration**:
   ```bash
   npm run migrate:legacy-users
   ```
4. **Verify results**:
   ```bash
   sqlite3 training.db "SELECT id, email FROM users;"
   ```

## Post-Migration

After migration, users will:
1. See their existing sessions continue to work
2. Be prompted for email on first access (if using placeholder email)
3. Retain all training history and OAuth tokens
4. Have their user IDs preserved

## Error Handling

All scripts include error handling:
- **Session Cleanup**: Logs errors but doesn't fail
- **Migration**: Rolls back on any error, preserving database integrity
- **Test Data**: Reports errors and exits with non-zero code

## Development

To add new scripts:
1. Create TypeScript file in this directory
2. Add npm script to `package.json`
3. Document in this README
4. Include error handling and logging
5. Use transactions for multi-step operations
