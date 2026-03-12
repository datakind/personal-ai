import { sqliteTable, integer, text, unique, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

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
  unique('user_material_unique').on(table.userId, table.materialId),
  index('completions_user_idx').on(table.userId),
  index('completions_material_idx').on(table.materialId),
  index('completions_synced_idx').on(table.synced),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  trainingCompletions: many(trainingCompletions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

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

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type TrainingMaterial = typeof trainingMaterials.$inferSelect;
export type NewTrainingMaterial = typeof trainingMaterials.$inferInsert;
export type TrainingCompletion = typeof trainingCompletions.$inferSelect;
export type NewTrainingCompletion = typeof trainingCompletions.$inferInsert;
