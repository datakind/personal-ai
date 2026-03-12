import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';

const sqlite = new Database('training.db');
const db = drizzle(sqlite);

console.log('Running migrations...');

migrate(db, { migrationsFolder: './db/migrations' });

console.log('Migrations completed successfully!');

sqlite.close();
