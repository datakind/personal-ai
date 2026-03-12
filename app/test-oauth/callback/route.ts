import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCode, createAccessToken, getClient } from '@/lib/oauth'

const TEST_TOKEN_COOKIE = 'test_oauth_token'
const TEST_SCOPES_COOKIE = 'test_oauth_scopes'
const OAUTH_STATE_COOKIE = 'oauth_state'
const COOKIE_MAX_AGE = 60 * 60 // 1 hour

function redirectToDone(request: NextRequest, error: string, description?: string) {
  const url = new URL('/test-oauth/done', request.url)
  url.searchParams.set('error', error)
  if (description) url.searchParams.set('error_description', description)
  return NextResponse.redirect(url.toString())
}

/** GET: OAuth callback – verify state (CSRF), exchange code for token, set cookie, redirect to /test-oauth/done */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const stateParam = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return redirectToDone(
        request,
        error,
        searchParams.get('error_description') ?? undefined
      )
    }

    const cookieStore = await cookies()
    const stateCookie = cookieStore.get(OAUTH_STATE_COOKIE)?.value
    if (!stateCookie || stateParam !== stateCookie) {
      return redirectToDone(
        request,
        'invalid_state',
        'State mismatch or missing. Possible CSRF or expired start; try starting the flow again from /test-oauth.'
      )
    }

    if (!code) {
      return redirectToDone(request, 'missing_code', 'No authorization code in URL')
    }

    const clientId = process.env.TEST_OAUTH_CLIENT_ID ?? 'test-client'
    const clientSecret = process.env.TEST_OAUTH_CLIENT_SECRET ?? 'test-secret'
    // Use the actual callback URL from this request so it matches what was stored with the code
    const requestUrl = new URL(request.url)
    const redirectUri = `${requestUrl.origin}${requestUrl.pathname}`

    const result = await exchangeCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    })

    if (!result) {
      return redirectToDone(
        request,
        'invalid_grant',
        'Code exchange failed. Check TEST_OAUTH_CLIENT_SECRET matches the client secret used when seeding.'
      )
    }

    const client = await getClient(clientId)
    if (!client) {
      return redirectToDone(request, 'invalid_client', 'Test OAuth client not found in database')
    }

    const tokenResult = await createAccessToken({
      clientId: client.id,
      personId: result.personId,
      scopes: result.scopes,
    })

    const doneUrl = new URL('/test-oauth/done', request.url)
    doneUrl.searchParams.set('scopes', result.scopes)
    const res = NextResponse.redirect(doneUrl.toString())
    res.cookies.delete(OAUTH_STATE_COOKIE)
    res.cookies.set(TEST_TOKEN_COOKIE, tokenResult.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    res.cookies.set(TEST_SCOPES_COOKIE, result.scopes, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('OAuth callback error:', err)
    return redirectToDone(
      request,
      'server_error',
      err instanceof Error ? err.message : 'Unexpected error during callback'
    )
  }
}
