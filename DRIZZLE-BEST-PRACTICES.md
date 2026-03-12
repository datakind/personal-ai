# Drizzle ORM

Drizzle ORM is a headless TypeScript ORM designed to be a thin typed layer on top of SQL. It provides both SQL-like and relational query APIs, offering the best of both worlds for accessing relational data. Drizzle is lightweight, performant, typesafe, and serverless-ready by design with zero dependencies. It supports PostgreSQL, MySQL, SQLite, SingleStore, MSSQL, and CockroachDB databases.

The library consists of two main packages: `drizzle-orm` for the query builder and schema definition, and `drizzle-kit` for migrations and database management. Drizzle lets you define database schemas in TypeScript, access data using SQL-like syntax or relational queries, and manage migrations through auto-generated SQL files. It operates natively through industry-standard database drivers and is optimized for serverless environments.

## Schema Definition - PostgreSQL Table

Define database tables using TypeScript with full type inference. Tables include columns with types, constraints, and modifiers.

```typescript
import { pgTable, serial, text, integer, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  age: integer('age'),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Schema Definition - MySQL Table

MySQL tables use mysql-specific column types and auto-increment for primary keys.

```typescript
import { mysqlTable, serial, text, int, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  age: int('age'),
  verified: boolean('verified').notNull().default(false),
});

export const posts = mysqlTable('posts', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 256 }),
  content: text('content').notNull(),
  authorId: int('author_id').references(() => users.id),
});
```

## Schema Definition - SQLite Table

SQLite tables use SQLite-specific column types with integer primary keys supporting auto-increment.

```typescript
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  age: integer('age'),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title'),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id),
});
```

## Database Connection - PostgreSQL

Initialize a Drizzle database connection with various PostgreSQL drivers including node-postgres, postgres.js, and Neon.

```typescript
// Using connection string (simplest)
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(process.env.DATABASE_URL);

// Using node-postgres Pool
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// Using postgres.js
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(process.env.DATABASE_URL);
const db = drizzle({ client: queryClient });

// Using Neon HTTP (serverless)
import { drizzle } from 'drizzle-orm/neon-http';

const db = drizzle(process.env.DATABASE_URL);
const result = await db.execute('select 1');
```

## Select Queries - Basic Select

Query data using SQL-like syntax with full type inference on results.

```typescript
import { eq, lt, gte, ne, and, or, like, sql } from 'drizzle-orm';

// Select all columns from users
const allUsers = await db.select().from(users);
// Result type: { id: number; name: string; email: string; age: number | null }[]

// Select specific columns (partial select)
const result = await db.select({
  userId: users.id,
  userName: users.name,
}).from(users);

// Select with computed columns
const withLowerName = await db.select({
  id: users.id,
  lowerName: sql<string>`lower(${users.name})`,
}).from(users);

// Select distinct
await db.selectDistinct().from(users).orderBy(users.id);
```

## Select Queries - Filtering with Where

Filter query results using comparison operators and combining conditions.

```typescript
import { eq, lt, gte, ne, and, or, not, like, ilike, inArray, isNull, between } from 'drizzle-orm';

// Simple equality filter
const user = await db.select().from(users).where(eq(users.id, 42));

// Multiple conditions with AND
const activeAdults = await db.select().from(users).where(
  and(
    gte(users.age, 18),
    eq(users.verified, true)
  )
);

// Multiple conditions with OR
const result = await db.select().from(users).where(
  or(
    eq(users.id, 1),
    eq(users.name, 'Dan')
  )
);

// Pattern matching
const searchResults = await db.select().from(users).where(
  like(users.name, '%john%')
);

// Case-insensitive pattern matching (PostgreSQL)
const caseInsensitive = await db.select().from(users).where(
  ilike(users.email, '%@gmail.com')
);

// IN clause
const specificUsers = await db.select().from(users).where(
  inArray(users.id, [1, 2, 3, 4])
);

// NULL checks
const noAge = await db.select().from(users).where(isNull(users.age));

// Negation
const notDan = await db.select().from(users).where(not(eq(users.name, 'Dan')));
```

## Select Queries - Pagination and Ordering

Control result ordering and implement pagination with limit and offset.

```typescript
import { asc, desc } from 'drizzle-orm';

// Order by single column
const orderedUsers = await db.select().from(users).orderBy(users.name);

// Order descending
const newestFirst = await db.select().from(users).orderBy(desc(users.createdAt));

// Multiple order columns
const multiOrder = await db.select().from(users).orderBy(asc(users.name), desc(users.id));

// Limit results
const firstTen = await db.select().from(users).limit(10);

// Pagination with offset
const page2 = await db.select().from(users).limit(10).offset(10);

// Complete pagination example
const getUsers = async (page = 1, pageSize = 10) => {
  return db.select()
    .from(users)
    .orderBy(asc(users.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
};

// Cursor-based pagination
const nextPage = async (cursor?: number, pageSize = 10) => {
  return db.select()
    .from(users)
    .where(cursor ? gt(users.id, cursor) : undefined)
    .limit(pageSize)
    .orderBy(asc(users.id));
};
```

## Select Queries - Aggregations

Perform aggregations like count, sum, avg, min, and max with grouping.

```typescript
import { count, countDistinct, sum, avg, min, max, sql } from 'drizzle-orm';

// Count all rows
const totalUsers = await db.select({ value: count() }).from(users);

// Count specific column
const userCount = await db.select({ value: count(users.id) }).from(users);

// Count distinct values
const uniqueNames = await db.select({ value: countDistinct(users.name) }).from(users);

// Sum values
const totalAge = await db.select({ value: sum(users.age) }).from(users);

// Average
const avgAge = await db.select({ value: avg(users.age) }).from(users);

// Min/Max
const youngest = await db.select({ value: min(users.age) }).from(users);
const oldest = await db.select({ value: max(users.age) }).from(users);

// Group by with aggregation
const usersByAge = await db.select({
  age: users.age,
  count: sql<number>`cast(count(${users.id}) as int)`,
})
  .from(users)
  .groupBy(users.age);

// Having clause
const popularAges = await db.select({
  age: users.age,
  count: sql<number>`cast(count(${users.id}) as int)`,
})
  .from(users)
  .groupBy(users.age)
  .having(({ count }) => gt(count, 5));
```

## Insert Queries

Insert single or multiple rows with optional returning clause for PostgreSQL/SQLite.

```typescript
// Insert single row
await db.insert(users).values({ name: 'Andrew', email: 'andrew@example.com' });

// Insert multiple rows
await db.insert(users).values([
  { name: 'Andrew', email: 'andrew@example.com' },
  { name: 'Dan', email: 'dan@example.com' },
]);

// Insert with returning (PostgreSQL/SQLite)
const inserted = await db.insert(users)
  .values({ name: 'Dan', email: 'dan@example.com' })
  .returning();

// Partial returning
const insertedId = await db.insert(users)
  .values({ name: 'Dan', email: 'dan@example.com' })
  .returning({ id: users.id });

// Upsert - On conflict do nothing (PostgreSQL/SQLite)
await db.insert(users)
  .values({ id: 1, name: 'John', email: 'john@example.com' })
  .onConflictDoNothing();

// Upsert - On conflict do update (PostgreSQL/SQLite)
await db.insert(users)
  .values({ id: 1, name: 'John', email: 'john@example.com' })
  .onConflictDoUpdate({
    target: users.id,
    set: { name: 'John Updated' }
  });

// MySQL - On duplicate key update
await db.insert(users)
  .values({ id: 1, name: 'John', email: 'john@example.com' })
  .onDuplicateKeyUpdate({ set: { name: 'John Updated' } });

// Type-safe insert with inferred types
type NewUser = typeof users.$inferInsert;

const insertUser = async (user: NewUser) => {
  return db.insert(users).values(user);
};
```

## Update Queries

Update rows with conditions and optional returning clause.

```typescript
import { eq, sql } from 'drizzle-orm';

// Basic update
await db.update(users)
  .set({ name: 'Mr. Dan' })
  .where(eq(users.name, 'Dan'));

// Update with SQL expression
await db.update(users)
  .set({ updatedAt: sql`NOW()` })
  .where(eq(users.id, 1));

// Update with returning (PostgreSQL/SQLite)
const updated = await db.update(users)
  .set({ name: 'Mr. Dan' })
  .where(eq(users.name, 'Dan'))
  .returning();

// Partial returning
const updatedIds = await db.update(users)
  .set({ verified: true })
  .where(eq(users.verified, false))
  .returning({ id: users.id });

// Update from another table (PostgreSQL/SQLite)
await db.update(users)
  .set({ cityId: cities.id })
  .from(cities)
  .where(and(eq(cities.name, 'Seattle'), eq(users.name, 'John')));
```

## Delete Queries

Delete rows with conditions and optional returning clause.

```typescript
import { eq, lt } from 'drizzle-orm';

// Delete all rows
await db.delete(users);

// Delete with condition
await db.delete(users).where(eq(users.name, 'Dan'));

// Delete with returning (PostgreSQL/SQLite)
const deleted = await db.delete(users)
  .where(eq(users.name, 'Dan'))
  .returning();

// Partial returning
const deletedIds = await db.delete(users)
  .where(lt(users.age, 18))
  .returning({ deletedId: users.id });
```

## Joins

Combine data from multiple tables using various join types.

```typescript
import { eq, sql } from 'drizzle-orm';

// Define related tables
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

const pets = pgTable('pets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: integer('owner_id').notNull().references(() => users.id),
});

// Left join - includes all users even without pets
const usersWithPets = await db.select()
  .from(users)
  .leftJoin(pets, eq(users.id, pets.ownerId));
// Result: { user: {...}, pets: {...} | null }[]

// Inner join - only users with pets
const onlyWithPets = await db.select()
  .from(users)
  .innerJoin(pets, eq(users.id, pets.ownerId));

// Right join
const allPets = await db.select()
  .from(users)
  .rightJoin(pets, eq(users.id, pets.ownerId));

// Full join
const all = await db.select()
  .from(users)
  .fullJoin(pets, eq(users.id, pets.ownerId));

// Partial select with join (flat result)
const flatResult = await db.select({
  userId: users.id,
  userName: users.name,
  petName: pets.name,
}).from(users).leftJoin(pets, eq(users.id, pets.ownerId));

// Self join with alias
import { alias } from 'drizzle-orm';

const parent = alias(users, 'parent');
const usersWithParents = await db.select()
  .from(users)
  .leftJoin(parent, eq(parent.id, users.parentId));
```

## Relational Queries - Schema with Relations

Define relations between tables for the relational query API.

```typescript
import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  authorId: integer('author_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  postId: integer('post_id').notNull(),
  authorId: integer('author_id').notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));
```

## Relational Queries - Querying with Relations

Query nested relational data with the `db.query` API (generates single SQL statement).

```typescript
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle({ connection: process.env.DATABASE_URL, schema });

// Find many with nested relations
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true,
  },
});
// Result: [{ id, name, posts: [{ id, content, authorId }] }]

// Find first
const firstUser = await db.query.users.findFirst({
  with: { posts: true },
});

// Deep nesting
const usersWithPostsAndComments = await db.query.users.findMany({
  with: {
    posts: {
      with: {
        comments: true,
      },
    },
  },
});

// Select specific columns
const partialSelect = await db.query.posts.findMany({
  columns: {
    id: true,
    content: true,
  },
  with: {
    comments: {
      columns: { content: true },
    },
  },
});

// Filtering in relational queries
const filteredPosts = await db.query.posts.findMany({
  where: (posts, { eq }) => eq(posts.authorId, 1),
  with: {
    comments: {
      where: (comments, { lt }) => lt(comments.createdAt, new Date()),
    },
  },
});

// Limit and offset
const paginatedPosts = await db.query.posts.findMany({
  limit: 5,
  offset: 10,
  with: {
    comments: { limit: 3 },
  },
});

// Order by
const orderedPosts = await db.query.posts.findMany({
  orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  with: {
    comments: {
      orderBy: (comments, { asc }) => [asc(comments.createdAt)],
    },
  },
});
```

## Transactions

Execute multiple operations atomically with transaction support.

```typescript
import { sql, eq } from 'drizzle-orm';

// Basic transaction
await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100` }).where(eq(accounts.id, 1));
  await tx.update(accounts).set({ balance: sql`${accounts.balance} + 100` }).where(eq(accounts.id, 2));
});

// Transaction with rollback
await db.transaction(async (tx) => {
  const [account] = await tx.select().from(accounts).where(eq(accounts.id, 1));

  if (account.balance < 100) {
    tx.rollback(); // Throws exception, rolls back transaction
  }

  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100` }).where(eq(accounts.id, 1));
});

// Return value from transaction
const newBalance = await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100` }).where(eq(accounts.id, 1));

  const [account] = await tx.select().from(accounts).where(eq(accounts.id, 1));
  return account.balance;
});

// Nested transactions (savepoints)
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'User 1' });

  await tx.transaction(async (tx2) => {
    await tx2.insert(users).values({ name: 'User 2' });
  });
});

// PostgreSQL transaction with isolation level
await db.transaction(async (tx) => {
  // ... operations
}, {
  isolationLevel: 'serializable',
  accessMode: 'read write',
});
```

## Indexes and Constraints

Define indexes, unique constraints, foreign keys, and check constraints.

```typescript
import { pgTable, serial, text, integer, varchar, index, uniqueIndex, unique, foreignKey, primaryKey, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 256 }).notNull().unique(), // inline unique
  age: integer('age'),
}, (table) => [
  index('name_idx').on(table.name),
  uniqueIndex('email_idx').on(table.email),
  check('age_check', sql`${table.age} > 0`),
]);

// Composite primary key
export const booksToAuthors = pgTable('books_to_authors', {
  bookId: integer('book_id').notNull(),
  authorId: integer('author_id').notNull(),
}, (table) => [
  primaryKey({ columns: [table.bookId, table.authorId] }),
]);

// Composite unique constraint
export const userProfiles = pgTable('user_profiles', {
  userId: integer('user_id'),
  profileType: text('profile_type'),
}, (table) => [
  unique('user_profile_unique').on(table.userId, table.profileType),
]);

// Foreign key with cascade
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  authorId: integer('author_id').references(() => users.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
});
```

## Drizzle Kit - Configuration

Configure drizzle-kit for migrations and database management.

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql', // 'mysql' | 'sqlite' | 'turso'
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

// Multiple schema files
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/*',
  out: './drizzle',
});
```

## Drizzle Kit - Migration Commands

Generate and apply database migrations using drizzle-kit CLI commands.

```bash
# Generate migrations from schema changes
npx drizzle-kit generate

# Generate with custom name
npx drizzle-kit generate --name=add_users_table

# Push schema directly to database (development)
npx drizzle-kit push

# Pull schema from existing database (introspection)
npx drizzle-kit pull

# Apply pending migrations
npx drizzle-kit migrate

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio

# Check migration consistency
npx drizzle-kit check

# Generate custom migration (empty file for manual SQL)
npx drizzle-kit generate --custom --name=seed_users
```

## Prepared Statements

Pre-compile queries with placeholders for improved performance.

```typescript
import { placeholder } from 'drizzle-orm';

// Prepared statement with placeholder
const prepared = db.select()
  .from(users)
  .where(eq(users.id, placeholder('id')))
  .prepare('get_user_by_id');

// Execute with parameters
const user = await prepared.execute({ id: 1 });
const anotherUser = await prepared.execute({ id: 2 });

// Multiple placeholders
const preparedSearch = db.select()
  .from(users)
  .where(and(
    gte(users.age, placeholder('minAge')),
    lte(users.age, placeholder('maxAge'))
  ))
  .limit(placeholder('limit'))
  .prepare('search_users');

const results = await preparedSearch.execute({ minAge: 18, maxAge: 30, limit: 10 });

// Prepared relational query
const preparedRelational = db.query.users.findMany({
  where: (users, { eq }) => eq(users.id, placeholder('id')),
  with: {
    posts: { limit: placeholder('postLimit') },
  },
}).prepare('user_with_posts');

const userWithPosts = await preparedRelational.execute({ id: 1, postLimit: 5 });
```

## Raw SQL and Custom Queries

Execute raw SQL queries and use SQL template literals for custom expressions.

```typescript
import { sql } from 'drizzle-orm';

// Execute raw SQL
const result = await db.execute(sql`SELECT * FROM users WHERE id = ${1}`);

// Raw SQL in select
const customSelect = await db.select({
  id: users.id,
  fullName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
  upperName: sql<string>`upper(${users.name})`,
}).from(users);

// SQL in where clause
await db.select().from(users).where(sql`${users.age} > 18`);

// Custom function
const customFunction = (column: any) => sql`lower(${column})`;
await db.select().from(users).where(eq(customFunction(users.email), 'test@example.com'));

// Using sql.raw for unsafe strings (use carefully)
const tableName = 'users';
await db.execute(sql`SELECT * FROM ${sql.raw(tableName)}`);

// Map result types with mapWith
const withMapping = await db.select({
  count: sql`count(*)`.mapWith(Number),
}).from(users);
```

## Type Inference

Leverage TypeScript type inference for insert and select types.

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Infer types from table definition
type User = InferSelectModel<typeof users>; // Select type (all fields, nullables as T | null)
type NewUser = InferInsertModel<typeof users>; // Insert type (required vs optional fields)

// Alternative syntax using $inferSelect and $inferInsert
type UserSelect = typeof users.$inferSelect;
type UserInsert = typeof users.$inferInsert;

// Use in functions
const createUser = async (user: NewUser): Promise<User> => {
  const [created] = await db.insert(users).values(user).returning();
  return created;
};

const getUser = async (id: number): Promise<User | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

// Partial types
type UserWithoutPassword = Omit<User, 'password'>;
type UserUpdateData = Partial<NewUser>;
```

Drizzle ORM provides a complete solution for TypeScript projects requiring database access with type safety. Its SQL-like query builder enables developers familiar with SQL to be immediately productive, while the relational query API simplifies fetching nested data. The library excels in serverless environments due to its zero-dependency architecture and efficient query generation.

Common integration patterns include using Drizzle with Next.js, Remix, SvelteKit, and other modern frameworks. The schema-first approach allows teams to version control their database structure alongside application code. Drizzle-kit handles migration generation and database synchronization, supporting both code-first (generate migrations from schema) and database-first (introspect existing database) workflows. The library's type inference ensures that schema changes are immediately reflected in TypeScript types throughout the application.
