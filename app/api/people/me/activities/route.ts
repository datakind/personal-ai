import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db/client'
import { activities } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/** GET: Return activities for the authenticated person (OAuth token with "activities" scope). */
export async function GET(request: Request) {
  const auth = await requireAuth(request as import('next/server').NextRequest, 'activities')
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid Bearer token with "activities" scope required' },
      { status: 401 }
    )
  }

  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.personId, auth.personId))
  return NextResponse.json(rows)
}
