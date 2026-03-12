import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db/client'
import { training } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/** GET: Return training for the authenticated person (OAuth token with "training" scope). */
export async function GET(request: Request) {
  const auth = await requireAuth(request as import('next/server').NextRequest, 'training')
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid Bearer token with "training" scope required' },
      { status: 401 }
    )
  }

  const rows = await db
    .select()
    .from(training)
    .where(eq(training.personId, auth.personId))
  return NextResponse.json(rows)
}
