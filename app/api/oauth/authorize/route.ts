import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import {
  getClient,
  validateRedirectUri,
  parseScopes,
  createAuthorizationCode,
  getConsent,
  saveConsent,
  scopeDescriptions,
  type Scope,
} from '@/lib/oauth'
import { SCOPES } from '@/db/schema'

export const dynamic = 'force-dynamic'

/** GET: Show consent or redirect to login. Query: client_id, redirect_uri, response_type=code, scope, state */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const responseType = searchParams.get('response_type')
  const scopeParam = searchParams.get('scope')
  const state = searchParams.get('state')
  const codeChallenge = searchParams.get('code_challenge') ?? null
  const codeChallengeMethod = searchParams.get('code_challenge_method')?.toLowerCase() ?? null

  if (!clientId || !redirectUri || responseType !== 'code') {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'client_id, redirect_uri, and response_type=code required' },
      { status: 400 }
    )
  }

  const client = await getClient(clientId)
  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Unknown client' },
      { status: 400 }
    )
  }
  if (!validateRedirectUri(client, redirectUri)) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'redirect_uri not allowed' },
      { status: 400 }
    )
  }

  const requestedScopes = parseScopes(scopeParam)
  const scopeStr = requestedScopes.length > 0 ? requestedScopes.join(' ') : SCOPES.join(' ')
  const forceConsent = searchParams.get('prompt') === 'consent'
  const session = await getSession()

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    const reqUrl = new URL(request.url)
    loginUrl.searchParams.set('return_to', reqUrl.pathname + reqUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  const priorConsent = forceConsent ? null : await getConsent(session.personId, client.id)
  const priorScopes = priorConsent ? priorConsent.trim().split(/\s+/).filter(Boolean) : []
  const scopesToGrant = priorConsent
    ? priorScopes.filter((s) => requestedScopes.length === 0 || requestedScopes.includes(s as Scope))
    : requestedScopes

  // If client requested more than previously consented, show consent again so user can grant the new scope(s).
  const requestedNotInPrior = requestedScopes.filter((s) => !priorScopes.includes(s))
  const skipConsent = priorConsent && scopesToGrant.length > 0 && requestedNotInPrior.length === 0

  if (skipConsent) {
    const { code } = await createAuthorizationCode({
      clientId: client.id,
      personId: session.personId,
      scopes: scopesToGrant.join(' '),
      redirectUri,
      codeChallenge: codeChallenge ?? undefined,
      codeChallengeMethod: codeChallengeMethod === 's256' || codeChallengeMethod === 'plain' ? codeChallengeMethod : undefined,
    })
    const target = new URL(redirectUri)
    target.searchParams.set('code', code)
    if (state) target.searchParams.set('state', state)
    return NextResponse.redirect(target.toString())
  }

  const consentUrl = new URL('/oauth/consent', request.url)
  consentUrl.searchParams.set('client_id', clientId)
  consentUrl.searchParams.set('redirect_uri', redirectUri)
  consentUrl.searchParams.set('scope', scopeStr)
  if (state) consentUrl.searchParams.set('state', state)
  if (codeChallenge) consentUrl.searchParams.set('code_challenge', codeChallenge)
  if (codeChallengeMethod) consentUrl.searchParams.set('code_challenge_method', codeChallengeMethod)
  return NextResponse.redirect(consentUrl.toString())
}

function buildRedirectUrl(redirectUri: string, params: { code?: string; error?: string; error_description?: string; state?: string | null }) {
  const target = new URL(redirectUri)
  if (params.code) target.searchParams.set('code', params.code)
  if (params.error) target.searchParams.set('error', params.error)
  if (params.error_description) target.searchParams.set('error_description', params.error_description)
  if (params.state) target.searchParams.set('state', params.state)
  return target.toString()
}

/** POST: Submit consent (allowed scopes). Body: client_id, redirect_uri, scope (requested), state, allowed_scopes (space-separated), or allow_all, or deny. If X-Response-Mode: json, returns JSON with redirect_url instead of 302. */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const clientId = form.get('client_id') as string | null
    const redirectUri = form.get('redirect_uri') as string | null
    const scopeParam = form.get('scope') as string | null
    const state = form.get('state') as string | null
    const codeChallenge = (form.get('code_challenge') as string | null)?.trim() || null
    const codeChallengeMethod = (form.get('code_challenge_method') as string | null)?.toLowerCase() || null
    const deny = form.get('deny')
    const allowAll = form.get('allow_all')
    // allowed_scopes (space-separated) is set by consent form when using "Allow selected" so we don't rely on checkboxes.
    const allowedScopesRaw = (form.get('allowed_scopes') as string | null)?.trim()
    const fromHidden =
      allowedScopesRaw?.split(/\s+/).filter((s): s is Scope => SCOPES.includes(s as Scope)) ?? []
    const allowedList: Scope[] =
      fromHidden.length > 0
        ? fromHidden
        : [
            ...(form.get('allow_facts') ? (['facts'] as const) : []),
            ...(form.get('allow_activities') ? (['activities'] as const) : []),
            ...(form.get('allow_training') ? (['training'] as const) : []),
          ]

    const jsonResponse = request.headers.get('X-Response-Mode') === 'json'

    const session = await getSession()
    if (!session) {
      if (jsonResponse) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'client_id and redirect_uri required' },
        { status: 400 }
      )
    }

    const client = await getClient(clientId)
    if (!client || !validateRedirectUri(client, redirectUri)) {
      return NextResponse.json(
        { error: 'invalid_client' },
        { status: 400 }
      )
    }

    if (deny) {
      const url = buildRedirectUrl(redirectUri, { error: 'access_denied', error_description: 'User denied consent', state })
      if (jsonResponse) return NextResponse.json({ redirect_url: url })
      return NextResponse.redirect(url)
    }

    const requestedScopes = parseScopes(scopeParam)
    const scopesToGrant: Scope[] =
      allowAll === '1'
        ? requestedScopes.length > 0 ? requestedScopes : ([...SCOPES] as Scope[])
        : allowedList

    if (scopesToGrant.length === 0) {
      const url = buildRedirectUrl(redirectUri, { error: 'access_denied', error_description: 'No scopes granted', state })
      if (jsonResponse) return NextResponse.json({ redirect_url: url })
      return NextResponse.redirect(url)
    }

    const scopeStr = scopesToGrant.join(' ')
    await saveConsent({
      personId: session.personId,
      clientId: client.id,
      scopes: scopeStr,
    })

    const { code } = await createAuthorizationCode({
      clientId: client.id,
      personId: session.personId,
      scopes: scopeStr,
      redirectUri,
      codeChallenge: codeChallenge ?? undefined,
      codeChallengeMethod: codeChallengeMethod === 's256' || codeChallengeMethod === 'plain' ? codeChallengeMethod : undefined,
    })

    const url = buildRedirectUrl(redirectUri, { code, state })
    if (jsonResponse) return NextResponse.json({ redirect_url: url })
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('OAuth authorize POST error:', err)
    return NextResponse.json(
      { error: 'server_error', error_description: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
