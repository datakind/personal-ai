import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db/client'
import { facts } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/** GET: Return facts for the authenticated person (OAuth token with "facts" scope). */
export async function GET(request: Request) {
  const auth = await requireAuth(request as import('next/server').NextRequest, 'facts')
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid Bearer token with "facts" scope required' },
      { status: 401 }
    )
  }

  const rows = await db
    .select()
    .from(facts)
    .where(eq(facts.personId, auth.personId))
  return NextResponse.json(rows)
}
