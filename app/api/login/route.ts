import { NextRequest, NextResponse } from 'next/server'
import { setSession } from '@/lib/session'

/** POST: Set session (person_id) and redirect to return_to. Body: person_id, return_to */
export async function POST(request: NextRequest) {
  const form = await request.formData()
  const personIdStr = form.get('person_id') as string | null
  const returnTo = (form.get('return_to') as string | null) ?? '/'

  const personId = personIdStr ? parseInt(personIdStr, 10) : NaN
  if (!Number.isInteger(personId) || personId < 1) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  await setSession(personId)

  const url = returnTo.startsWith('/') ? new URL(returnTo, request.url) : new URL('/', request.url)
  return NextResponse.redirect(url.toString())
}
