import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // Cryptographically secure random token
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const oauthTokens = sqliteTable('oauth_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }).notNull(),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const assessments = sqliteTable('assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  assessmentType: text('assessment_type', { enum: ['PHQ-2', 'PHQ-9'] }).notNull(),
  totalScore: integer('total_score').notNull(),
  responses: text('responses', { mode: 'json' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
});

// Export TypeScript types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type OAuthToken = InferSelectModel<typeof oauthTokens>;
export type NewOAuthToken = InferInsertModel<typeof oauthTokens>;
export type Patient = InferSelectModel<typeof patients>;
export type NewPatient = InferInsertModel<typeof patients>;
export type Assessment = InferSelectModel<typeof assessments>;
export type NewAssessment = InferInsertModel<typeof assessments>;

// Define relations for relational queries
export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  oauthToken: one(oauthTokens),
  createdPatients: many(patients),
  assessments: many(assessments),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const oauthTokensRelations = relations(oauthTokens, ({ one }) => ({
  user: one(users, {
    fields: [oauthTokens.userId],
    references: [users.id],
  }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [patients.createdById],
    references: [users.id],
  }),
  assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  patient: one(patients, {
    fields: [assessments.patientId],
    references: [patients.id],
  }),
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
}));
