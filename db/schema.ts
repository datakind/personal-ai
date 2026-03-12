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
