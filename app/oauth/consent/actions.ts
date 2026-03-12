'use server'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import {
  getClient,
  validateRedirectUri,
  parseScopes,
  createAuthorizationCode,
  saveConsent,
  type Scope,
} from '@/lib/oauth'
import { SCOPES } from '@/db/schema'

export type ConsentResult = { error: string } | void

export async function submitConsent(formData: FormData): Promise<ConsentResult> {
  const clientId = formData.get('client_id') as string | null
  const redirectUri = formData.get('redirect_uri') as string | null
  const scopeParam = formData.get('scope') as string | null
  const state = formData.get('state') as string | null
  const codeChallenge = (formData.get('code_challenge') as string | null)?.trim() || null
  const codeChallengeMethod = (formData.get('code_challenge_method') as string | null)?.toLowerCase() || null
  const deny = formData.get('deny')
  const allowAll = formData.get('allow_all')
  // "Allow selected" sends allowed_scopes (space-separated) from JS so we don't rely on checkboxes
  // making it through Server Action form serialization. Fallback to individual checkboxes.
  const allowedScopesRaw = (formData.get('allowed_scopes') as string | null)?.trim()
  const fromHidden =
    allowedScopesRaw?.split(/\s+/).filter((s): s is Scope => SCOPES.includes(s as Scope)) ?? []
  const allowedList: Scope[] =
    fromHidden.length > 0
      ? fromHidden
      : [
          ...(formData.get('allow_facts') ? (['facts'] as const) : []),
          ...(formData.get('allow_activities') ? (['activities'] as const) : []),
          ...(formData.get('allow_training') ? (['training'] as const) : []),
        ]

  const session = await getSession()
  if (!session) {
    return { error: 'Not signed in. Please sign in again.' }
  }

  if (!clientId || !redirectUri) {
    return { error: 'Missing client_id or redirect_uri.' }
  }

  const client = await getClient(clientId)
  if (!client || !validateRedirectUri(client, redirectUri)) {
    return { error: 'Invalid or unknown application.' }
  }

  if (deny) {
    const target = new URL(redirectUri)
    target.searchParams.set('error', 'access_denied')
    target.searchParams.set('error_description', 'User denied consent')
    if (state) target.searchParams.set('state', state)
    redirect(target.toString())
  }

  const requestedScopes = parseScopes(scopeParam ?? null)
  const scopesToGrant: Scope[] =
    allowAll === '1'
      ? requestedScopes.length > 0 ? requestedScopes : ([...SCOPES] as Scope[])
      : allowedList

  if (scopesToGrant.length === 0) {
    const target = new URL(redirectUri)
    target.searchParams.set('error', 'access_denied')
    target.searchParams.set('error_description', 'No scopes granted. Select at least one.')
    if (state) target.searchParams.set('state', state)
    redirect(target.toString())
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

  const target = new URL(redirectUri)
  target.searchParams.set('code', code)
  if (state) target.searchParams.set('state', state)
  redirect(target.toString())
}
