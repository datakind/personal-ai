import { InferSelectModel } from 'drizzle-orm'
import { people, facts, activities, training } from './schema'

// Base types inferred from schema
export type Person = InferSelectModel<typeof people>
export type Fact = InferSelectModel<typeof facts>
export type Activity = InferSelectModel<typeof activities>
export type Training = InferSelectModel<typeof training>

// Composite type for query results with related facts
export type PersonWithFacts = Person & {
  facts: Fact[]
}

// Person with all relations (for detail view)
export type PersonWithRelations = Person & {
  facts: Fact[]
  activities: Activity[]
  training: Training[]
}
