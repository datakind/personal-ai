import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { people } from '@/db/schema'

export const dynamic = 'force-dynamic'

/** POST: Create a new person. Body: optional JSON {} */
export async function POST() {
  const [person] = await db.insert(people).values({}).returning()
  if (!person?.id) {
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 })
  }
  return NextResponse.json({ id: person.id }, { status: 201 })
}
