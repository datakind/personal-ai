import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db/client'
import type { PersonWithRelations } from '@/db/types'

async function getPerson(id: number): Promise<PersonWithRelations | null> {
  const [person] = await db.query.people.findMany({
    where: (p, { eq }) => eq(p.id, id),
    with: { facts: true, activities: true, training: true },
  })
  return person ?? null
}

function deriveName(person: PersonWithRelations): string {
  const givenName = person.facts.find((f) => f.key === 'givenName')?.value
  const familyName = person.facts.find((f) => f.key === 'familyName')?.value
  if (givenName && familyName) return `${givenName} ${familyName}`
  if (givenName) return givenName
  if (familyName) return familyName
  return `Person #${person.id}`
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const personId = parseInt(id, 10)
  if (!Number.isInteger(personId) || personId < 1) notFound()

  const person = await getPerson(personId)
  if (!person) notFound()

  const displayName = deriveName(person)
  const formattedDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(person.createdAt)

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-block text-sm text-zinc-500 dark:text-zinc-400 hover:underline mb-6"
        >
          ← Back to People
        </Link>
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
          {displayName}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8">
          Added {formattedDate}
        </p>

        {person.facts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-3">Facts</h2>
            <ul className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
              {person.facts.map((f) => (
                <li key={f.id} className="px-4 py-2 flex justify-between gap-4">
                  <span className="text-zinc-600 dark:text-zinc-400">{f.key}</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{f.value}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {person.activities.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-3">Activities</h2>
            <ul className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
              {person.activities.map((a) => (
                <li key={a.id} className="px-4 py-2 flex justify-between gap-4">
                  <span className="text-zinc-600 dark:text-zinc-400">{a.category}</span>
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                    {new Date(a.activityTime).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {person.training.length > 0 && (
          <section>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-3">Training</h2>
            <ul className="space-y-3">
              {person.training.map((t) => (
                <li
                  key={t.id}
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{t.name}</div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{t.description}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                    {new Date(t.trainingTime).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {person.facts.length === 0 && person.activities.length === 0 && person.training.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400">No data stored yet for this person.</p>
        )}
      </div>
    </main>
  )
}
