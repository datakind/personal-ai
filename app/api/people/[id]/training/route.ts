import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { training, people } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/** GET: List training for a person. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const personId = parseInt(id, 10)
  if (!Number.isInteger(personId) || personId < 1) {
    return NextResponse.json({ error: 'Invalid person id' }, { status: 400 })
  }
  const rows = await db.select().from(training).where(eq(training.personId, personId))
  return NextResponse.json(rows)
}

/** POST: Add training. Body: { "name": string, "description": string, "trainingTime"?: string (ISO date) } */
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

  let body: { name?: string; description?: string; trainingTime?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const name = body.name?.trim()
  const description = body.description != null ? String(body.description) : ''
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  const trainingTime = body.trainingTime ? new Date(body.trainingTime) : new Date()
  if (Number.isNaN(trainingTime.getTime())) {
    return NextResponse.json({ error: 'trainingTime must be a valid ISO date string' }, { status: 400 })
  }

  const [row] = await db.insert(training).values({ personId, name, description, trainingTime }).returning()
  return NextResponse.json(row, { status: 201 })
}
