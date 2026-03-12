import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { facts, people } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/** GET: List facts for a person (no auth for simplicity; protect in production if needed). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const personId = parseInt(id, 10)
  if (!Number.isInteger(personId) || personId < 1) {
    return NextResponse.json({ error: 'Invalid person id' }, { status: 400 })
  }
  const rows = await db.select().from(facts).where(eq(facts.personId, personId))
  return NextResponse.json(rows)
}

/** POST: Add a fact for a person. Body: { "key": string, "value": string } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const personId = parseInt(id, 10)
  if (!Number.isInteger(personId) || personId < 1) {
    return NextResponse.json({ error: 'Invalid person id' }, { status: 400 })
  }

  const [person] = await db.select().from(people).where(eq(people.id, personId))
  if (!person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 })
  }

  let body: { key?: string; value?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const key = body.key?.trim()
  const value = body.value != null ? String(body.value) : ''
  if (!key) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 })
  }

  const [row] = await db.insert(facts).values({ personId, key, value }).returning()
  return NextResponse.json(row, { status: 201 })
}
