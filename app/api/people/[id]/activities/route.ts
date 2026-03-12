import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { activities, people } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/** GET: List activities for a person. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const personId = parseInt(id, 10)
  if (!Number.isInteger(personId) || personId < 1) {
    return NextResponse.json({ error: 'Invalid person id' }, { status: 400 })
  }
  const rows = await db.select().from(activities).where(eq(activities.personId, personId))
  return NextResponse.json(rows)
}

/** POST: Add an activity. Body: { "category": string, "activityTime": string (ISO date) } */
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

  let body: { category?: string; activityTime?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const category = body.category?.trim()
  if (!category) {
    return NextResponse.json({ error: 'category is required' }, { status: 400 })
  }
  const activityTime = body.activityTime ? new Date(body.activityTime) : new Date()
  if (Number.isNaN(activityTime.getTime())) {
    return NextResponse.json({ error: 'activityTime must be a valid ISO date string' }, { status: 400 })
  }

  const [row] = await db.insert(activities).values({ personId, category, activityTime }).returning()
  return NextResponse.json(row, { status: 201 })
}
