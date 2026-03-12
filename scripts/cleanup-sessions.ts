#!/usr/bin/env tsx

/**
 * Scheduled cleanup script for expired sessions.
 * 
 * This script can be run manually or scheduled via cron/systemd timer
 * to periodically clean up expired sessions from the database.
 * 
 * Usage:
 *   npm run cleanup:sessions
 *   or
 *   tsx scripts/cleanup-sessions.ts
 * 
 * Cron example (daily at 2 AM):
 *   0 2 * * * cd /path/to/app && npm run cleanup:sessions
 * 
 * Validates:
 * - Requirements 8.4: Execute cleanup process daily where scheduled task system available
 */

import { cleanupExpiredSessions } from '../lib/cleanup';

async function main() {
  console.log('[Scheduled Cleanup] Starting expired session cleanup...');
  
  try {
    const deletedCount = await cleanupExpiredSessions();
    console.log(`[Scheduled Cleanup] Completed. Deleted ${deletedCount} expired session(s)`);
    process.exit(0);
  } catch (error) {
    console.error('[Scheduled Cleanup] Failed:', error);
    process.exit(1);
  }
}

main();
