/**
 * Script to create test legacy data for migration testing
 * 
 * This creates sample legacy tables with incrementing identifiers,
 * training history, and OAuth tokens to test the migration process.
 */

import Database from 'better-sqlite3';

function createTestLegacyData(dbPath: string = 'training.db') {
  const sqlite = new Database(dbPath);

  try {
    console.log('Creating test legacy tables...');

    // Create legacy_users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS legacy_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    // Create legacy_training_history table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS legacy_training_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        training_id TEXT NOT NULL,
        completed_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES legacy_users(id)
      )
    `);

    // Create legacy_oauth_tokens table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS legacy_oauth_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES legacy_users(id)
      )
    `);

    console.log('Inserting test data...');

    // Insert test users
    const insertUser = sqlite.prepare('INSERT INTO legacy_users (created_at) VALUES (?)');
    const user1 = insertUser.run(Date.now() / 1000 - 86400 * 30); // 30 days ago
    const user2 = insertUser.run(Date.now() / 1000 - 86400 * 60); // 60 days ago
    const user3 = insertUser.run(Date.now() / 1000 - 86400 * 90); // 90 days ago

    console.log(`Created ${3} test users`);

    // Insert training history
    const insertHistory = sqlite.prepare(
      'INSERT INTO legacy_training_history (user_id, training_id, completed_at) VALUES (?, ?, ?)'
    );

    insertHistory.run(user1.lastInsertRowid, 'training-101', Date.now() / 1000 - 86400 * 20);
    insertHistory.run(user1.lastInsertRowid, 'training-102', Date.now() / 1000 - 86400 * 15);
    insertHistory.run(user2.lastInsertRowid, 'training-101', Date.now() / 1000 - 86400 * 50);
    insertHistory.run(user2.lastInsertRowid, 'training-103', Date.now() / 1000 - 86400 * 45);
    insertHistory.run(user3.lastInsertRowid, 'training-102', Date.now() / 1000 - 86400 * 80);

    console.log(`Created ${5} training history records`);

    // Insert OAuth tokens
    const insertToken = sqlite.prepare(
      'INSERT INTO legacy_oauth_tokens (user_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)'
    );

    insertToken.run(
      user1.lastInsertRowid,
      'access_token_user1_abc123',
      'refresh_token_user1_xyz789',
      Date.now() / 1000 + 86400 * 30
    );
    insertToken.run(
      user2.lastInsertRowid,
      'access_token_user2_def456',
      null,
      Date.now() / 1000 + 86400 * 15
    );

    console.log(`Created ${2} OAuth token records`);

    console.log('\n✓ Test legacy data created successfully');
    console.log('\nSummary:');
    console.log('- 3 legacy users');
    console.log('- 5 training history records');
    console.log('- 2 OAuth tokens');
    console.log('\nRun migration with: npm run migrate:legacy-users');

    sqlite.close();
  } catch (error) {
    console.error('Failed to create test data:', error);
    sqlite.close();
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  const dbPath = process.argv[2] || 'training.db';
  console.log(`Creating test legacy data in: ${dbPath}\n`);
  createTestLegacyData(dbPath);
}

export { createTestLegacyData };
