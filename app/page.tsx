import { db } from '@/db/client'
import type { PersonWithFacts } from '@/db/types'
import Link from 'next/link'

async function getPeople(): Promise<PersonWithFacts[]> {
  return db.query.people.findMany({
    with: {
      facts: true,
    },
    orderBy: (people, { desc }) => [desc(people.createdAt)],
  })
}

function deriveName(person: PersonWithFacts): string {
  const givenName = person.facts.find(f => f.key === 'givenName')?.value
  const familyName = person.facts.find(f => f.key === 'familyName')?.value
  
  if (givenName && familyName) {
    return `${givenName} ${familyName}`
  }
  
  if (givenName) {
    return givenName
  }
  
  if (familyName) {
    return familyName
  }
  
  return `Person #${person.id}`
}

function PersonCard({ person }: { person: PersonWithFacts }) {
  const displayName = deriveName(person)
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(person.createdAt)
  
  return (
    <Link
      href={`/people/${person.id}`}
      className="block p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
    >
      <h2 className="text-xl font-medium text-black dark:text-zinc-50 mb-2">
        {displayName}
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Added {formattedDate}
      </p>
    </Link>
  )
}

function EmptyState() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
      <div className="max-w-md text-center px-4">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
          No People Yet
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          There are currently no people in the system. People can be added through the API endpoints.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Use POST /api/people to create a new person record.
        </p>
      </div>
    </main>
  )
}

export default async function PeoplePage() {
  const peopleList = await getPeople()
  
  if (peopleList.length === 0) {
    return <EmptyState />
  }
  
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold mb-8 text-black dark:text-zinc-50">
          People
        </h1>
        <div className="space-y-4">
          {peopleList.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      </div>
    </main>
  )
}
