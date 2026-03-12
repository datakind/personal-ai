import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// People table - core entity
export const people = sqliteTable('people', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Facts table - primitive data about a person
export const facts = sqliteTable('facts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  personId: integer('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  key: text('key').notNull(), // e.g., 'givenName', 'familyName', 'dateOfBirth'
  value: text('value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Activities table - actions performed by a person
export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  personId: integer('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  activityTime: integer('activity_time', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Training table - education received by a person
export const training = sqliteTable('training', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  personId: integer('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  trainingTime: integer('training_time', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const peopleRelations = relations(people, ({ many }) => ({
  facts: many(facts),
  activities: many(activities),
  training: many(training),
}))

export const factsRelations = relations(facts, ({ one }) => ({
  person: one(people, {
    fields: [facts.personId],
    references: [people.id],
  }),
}))

export const activitiesRelations = relations(activities, ({ one }) => ({
  person: one(people, {
    fields: [activities.personId],
    references: [people.id],
  }),
}))

export const trainingRelations = relations(training, ({ one }) => ({
  person: one(people, {
    fields: [training.personId],
    references: [people.id],
  }),
}))

// --- OAuth 2.0 (authorization server) ---

/** Allowed scopes: facts, activities, training (read access to that data type) */
export const SCOPES = ['facts', 'activities', 'training'] as const
export type Scope = (typeof SCOPES)[number]

/** Registered OAuth clients (e.g. training platform) */
export const oauthClients = sqliteTable('oauth_clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: text('client_id').notNull().unique(),
  clientSecretHash: text('client_secret_hash').notNull(),
  name: text('name').notNull(),
  redirectUris: text('redirect_uris').notNull(), // JSON array of allowed redirect_uri
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

/** Short-lived authorization codes (exchange for access token) */
export const oauthAuthorizationCodes = sqliteTable('oauth_authorization_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  clientId: integer('client_id').notNull().references(() => oauthClients.id, { onDelete: 'cascade' }),
  personId: integer('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  scopes: text('scopes').notNull(), // space-separated list
  redirectUri: text('redirect_uri').notNull(),
  /** PKCE: code_challenge (base64url), required when code_challenge_method is sent */
  codeChallenge: text('code_challenge'),
  /** PKCE: S256 or plain (S256 recommended for public clients) */
  codeChallengeMethod: text('code_challenge_method'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().$defaultFn(() => false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

/** Access tokens for API access */
export const oauthAccessTokens = sqliteTable('oauth_access_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull().unique(),
  clientId: integer('client_id').notNull().references(() => oauthClients.id, { onDelete: 'cascade' }),
  personId: integer('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  scopes: text('scopes').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

/** Remember consent so we can skip consent screen on re-authorization */
export const oauthConsents = sqliteTable('oauth_consents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  personId: integer('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => oauthClients.id, { onDelete: 'cascade' }),
  scopes: text('scopes').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const oauthAuthorizationCodesRelations = relations(oauthAuthorizationCodes, ({ one }) => ({
  client: one(oauthClients),
  person: one(people),
}))
export const oauthAccessTokensRelations = relations(oauthAccessTokens, ({ one }) => ({
  client: one(oauthClients),
  person: one(people),
}))
export const oauthConsentsRelations = relations(oauthConsents, ({ one }) => ({
  client: one(oauthClients),
  person: one(people),
}))
