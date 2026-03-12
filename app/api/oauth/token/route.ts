import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, createAccessToken, getClient } from '@/lib/oauth'

/** POST: Exchange authorization code for access token. Body: grant_type=authorization_code, code, redirect_uri, client_id, client_secret */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''
  let clientId: string | null
  let clientSecret: string | null
  let code: string | null
  let redirectUri: string | null
  let grantType: string | null
  let codeVerifier: string | null = null

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData()
    clientId = form.get('client_id') as string | null
    clientSecret = form.get('client_secret') as string | null
    code = form.get('code') as string | null
    redirectUri = form.get('redirect_uri') as string | null
    grantType = form.get('grant_type') as string | null
    codeVerifier = (form.get('code_verifier') as string | null) ?? null
  } else if (contentType.includes('application/json')) {
    const body = await request.json()
    clientId = body.client_id ?? null
    clientSecret = body.client_secret ?? null
    code = body.code ?? null
    redirectUri = body.redirect_uri ?? null
    grantType = body.grant_type ?? null
    codeVerifier = body.code_verifier ?? null
  } else {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Content-Type must be application/x-www-form-urlencoded or application/json' },
      { status: 400 }
    )
  }

  if (grantType !== 'authorization_code') {
    return NextResponse.json(
      { error: 'unsupported_grant_type' },
      { status: 400 }
    )
  }
  if (!code || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'code, client_id, client_secret, redirect_uri required' },
      { status: 400 }
    )
  }

  const result = await exchangeCode({
    code,
    clientId,
    clientSecret,
    redirectUri,
    codeVerifier: codeVerifier ?? undefined,
  })

  if (!result) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
      { status: 400 }
    )
  }

  const client = await getClient(clientId)
  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client' },
      { status: 400 }
    )
  }

  const token = await createAccessToken({
    clientId: client.id,
    personId: result.personId,
    scopes: result.scopes,
  })

  // RFC 6749 §5.1: include scope in response when granted scope differs from requested or for clarity
  return NextResponse.json({
    access_token: token.access_token,
    token_type: 'Bearer',
    expires_in: token.expires_in,
    scope: result.scopes,
  })
}
