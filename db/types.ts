import { InferSelectModel } from 'drizzle-orm'
import { people, facts } from './schema'

// Base types inferred from schema
export type Person = InferSelectModel<typeof people>
export type Fact = InferSelectModel<typeof facts>

// Composite type for query results with related facts
export type PersonWithFacts = Person & {
  facts: Fact[]
}
