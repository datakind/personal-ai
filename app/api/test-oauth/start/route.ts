import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'

const OAUTH_STATE_COOKIE = 'oauth_state'
const STATE_COOKIE_MAX_AGE = 600 // 10 minutes

/**
 * GET: Generate state, set cookie, redirect to authorize.
 * Query: prompt=consent (optional) to force consent screen.
 * Demonstrates CSRF mitigation: state is stored before redirect and verified at callback.
 */
export async function GET(request: NextRequest) {
  const state = randomBytes(24).toString('base64url')
  const { searchParams } = new URL(request.url)
  const prompt = searchParams.get('prompt')

  const clientId = process.env.TEST_OAUTH_CLIENT_ID ?? 'test-client'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
  const redirectUri = `${baseUrl}/test-oauth/callback`
  const scope = 'facts activities training'

  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
  })
  if (prompt === 'consent') authParams.set('prompt', 'consent')

  const authUrl = new URL('/api/oauth/authorize', request.url)
  authUrl.search = authParams.toString()

  const res = NextResponse.redirect(authUrl.toString())
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
