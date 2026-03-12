import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db/client'
import { getSession } from '@/lib/session'
import type { PersonWithFacts } from '@/db/types'

async function getPeople(): Promise<PersonWithFacts[]> {
  return db.query.people.findMany({
    with: { facts: true },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })
}

function deriveName(person: PersonWithFacts): string {
  const givenName = person.facts.find((f) => f.key === 'givenName')?.value
  const familyName = person.facts.find((f) => f.key === 'familyName')?.value
  if (givenName && familyName) return `${givenName} ${familyName}`
  if (givenName) return givenName
  if (familyName) return familyName
  return `Person #${person.id}`
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>
}) {
  const session = await getSession()
  const params = await searchParams
  const returnTo = params.return_to ?? '/'

  const peopleList = await getPeople()

  if (peopleList.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No people in system</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
            Add a person via the API (e.g. POST /api/people) or database, then return here to sign in.
          </p>
          <Link
            href="/"
            className="text-zinc-900 dark:text-zinc-100 underline font-medium"
          >
            Back to home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Sign in
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
          Choose which person you are (for OAuth and data access).
        </p>
        <div className="space-y-2">
          {peopleList.map((person) => (
            <LoginButton
              key={person.id}
              personId={person.id}
              displayName={deriveName(person)}
              returnTo={returnTo}
            />
          ))}
        </div>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">
            Back to People
          </Link>
        </p>
      </div>
    </main>
  )
}

function LoginButton({
  personId,
  displayName,
  returnTo,
}: {
  personId: number
  displayName: string
  returnTo: string
}) {
  return (
    <form action="/api/login" method="post" className="block">
      <input type="hidden" name="person_id" value={String(personId)} />
      <input type="hidden" name="return_to" value={returnTo} />
      <button
        type="submit"
        className="w-full text-left px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        {displayName}
      </button>
    </form>
  )
}
