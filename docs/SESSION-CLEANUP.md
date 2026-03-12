# Session Cleanup Process

## Overview

The session cleanup process automatically removes expired sessions from the database to prevent accumulation of stale data. This ensures the database remains clean and performant over time.

## Implementation

### Cleanup Function

The core cleanup function is located in `lib/cleanup.ts`:

```typescript
import { cleanupExpiredSessions } from '@/lib/cleanup';

// Returns the number of expired sessions deleted
const deletedCount = await cleanupExpiredSessions();
```

This function:
- Queries the database for sessions where `expiresAt < current time`
- Deletes all expired sessions in a single operation
- Returns the count of deleted sessions
- Logs the deletion count for monitoring

### Automatic Cleanup on Startup

The cleanup process runs automatically when the application starts. This is implemented in `app/layout.tsx`:

```typescript
import { cleanupExpiredSessions } from "@/lib/cleanup";

// Run cleanup on application startup
cleanupExpiredSessions().catch((error) => {
  console.error('[Startup] Failed to cleanup expired sessions:', error);
});
```

**Benefits:**
- Ensures expired sessions are cleaned up whenever the app restarts
- No additional infrastructure required
- Works in all deployment environments

### Scheduled Cleanup (Optional)

For long-running applications, you can schedule periodic cleanup using the provided script:

```bash
npm run cleanup:sessions
```

#### Cron Setup

To run cleanup daily at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line
0 2 * * * cd /path/to/your/app && npm run cleanup:sessions
```

#### Systemd Timer Setup

Create `/etc/systemd/system/session-cleanup.service`:

```ini
[Unit]
Description=Clean up expired sessions
After=network.target

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/npm run cleanup:sessions
```

Create `/etc/systemd/system/session-cleanup.timer`:

```ini
[Unit]
Description=Run session cleanup daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start the timer:

```bash
sudo systemctl enable session-cleanup.timer
sudo systemctl start session-cleanup.timer
```

## Requirements Validation

This implementation validates the following requirements:

- **8.1**: Provides a cleanup process that deletes expired session entries
- **8.2**: Deletes all sessions where `expires_at` is before the current timestamp
- **8.3**: Executes cleanup automatically on application startup
- **8.4**: Provides scheduled cleanup capability for environments with task schedulers

## Monitoring

The cleanup process logs its activity:

```
[Cleanup] Deleted 5 expired session(s)
```

Monitor these logs to track:
- How many sessions are being cleaned up
- Whether cleanup is running as expected
- Any errors during the cleanup process

## Testing

Unit tests are provided in `tests/cleanup.test.ts` to verify:
- Expired sessions are deleted
- Valid sessions are preserved
- Multiple expired sessions are handled correctly
- Zero sessions deleted when none are expired

Run tests with:

```bash
npm test tests/cleanup.test.ts
```

## Performance Considerations

- The cleanup operation uses a single DELETE query with a WHERE clause
- Database indexes on `expiresAt` can improve cleanup performance for large session tables
- The cleanup is non-blocking and runs asynchronously on startup
- Failed cleanup on startup does not prevent the application from starting
