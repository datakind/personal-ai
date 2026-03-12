import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/oauth'
import { db } from '@/db/client'
import { facts, activities, training } from '@/db/schema'
import { eq } from 'drizzle-orm'

const TEST_TOKEN_COOKIE = 'test_oauth_token'

const ENDPOINTS = ['facts', 'activities', 'training'] as const

/** GET ?endpoint=facts|activities|training – uses test token from cookie, returns same as /api/people/me/:endpoint */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(TEST_TOKEN_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ error: 'No test token in cookie' }, { status: 401 })
  }

  const payload = await verifyAccessToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const url = new URL(request.url)
  const endpoint = url.searchParams.get('endpoint') as (typeof ENDPOINTS)[number] | null
  if (!endpoint || !ENDPOINTS.includes(endpoint)) {
    return NextResponse.json(
      { error: 'Missing or invalid endpoint. Use ?endpoint=facts|activities|training' },
      { status: 400 }
    )
  }

  if (!payload.scopes.includes(endpoint)) {
    return NextResponse.json(
      { error: `Token does not have "${endpoint}" scope` },
      { status: 403 }
    )
  }

  if (endpoint === 'facts') {
    const rows = await db.select().from(facts).where(eq(facts.personId, payload.personId))
    return NextResponse.json(rows)
  }
  if (endpoint === 'activities') {
    const rows = await db.select().from(activities).where(eq(activities.personId, payload.personId))
    return NextResponse.json(rows)
  }
  const rows = await db.select().from(training).where(eq(training.personId, payload.personId))
  return NextResponse.json(rows)
}
