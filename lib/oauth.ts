import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'
import { db } from '@/db/client'
import {
  oauthClients,
  oauthAuthorizationCodes,
  oauthAccessTokens,
  oauthConsents,
  type Scope,
  SCOPES,
} from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

const CODE_BYTES = 32
const TOKEN_BYTES = 32
const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function generateId(bytes: number): string {
  return randomBytes(bytes).toString('base64url').replace(/=/g, '')
}

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

function verifySecret(plain: string, hashed: string): boolean {
  const h = hashSecret(plain)
  if (h.length !== hashed.length) return false
  return timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hashed, 'hex'))
}

/** Validate requested scope string; return only allowed scopes. */
export function parseScopes(scopeStr: string | null): Scope[] {
  if (!scopeStr || typeof scopeStr !== 'string') return []
  const requested = scopeStr.trim().split(/\s+/).filter(Boolean)
  return requested.filter((s): s is Scope => SCOPES.includes(s as Scope))
}

/** Get client by client_id. */
export async function getClient(clientId: string) {
  const [client] = await db
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.clientId, clientId))
  return client ?? null
}

/** Check redirect_uri against client's allowed list. */
export function validateRedirectUri(
  client: { redirectUris: string },
  redirectUri: string
): boolean {
  let uris: string[]
  try {
    uris = JSON.parse(client.redirectUris) as string[]
  } catch {
    return false
  }
  return uris.includes(redirectUri)
}

/** Create authorization code and return it. Optional PKCE: codeChallenge + codeChallengeMethod (e.g. S256). */
export async function createAuthorizationCode(params: {
  clientId: number
  personId: number
  scopes: string
  redirectUri: string
  codeChallenge?: string | null
  codeChallengeMethod?: string | null
}) {
  const code = generateId(CODE_BYTES)
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)
  await db.insert(oauthAuthorizationCodes).values({
    code,
    clientId: params.clientId,
    personId: params.personId,
    scopes: params.scopes,
    redirectUri: params.redirectUri,
    codeChallenge: params.codeChallenge ?? null,
    codeChallengeMethod: params.codeChallengeMethod ?? null,
    expiresAt,
  })
  return { code, expiresAt }
}

/** Compute PKCE code_challenge from code_verifier (S256). */
function computeS256Challenge(verifier: string): string {
  return createHash('sha256').update(verifier, 'utf8').digest('base64url')
}

/** Consume code and return personId + scopes; returns null if invalid. When the code was issued with PKCE, code_verifier is required and verified. */
export async function exchangeCode(params: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
  codeVerifier?: string | null
}): Promise<{ personId: number; scopes: string } | null> {
  const client = await getClient(params.clientId)
  if (!client || !verifySecret(params.clientSecret, client.clientSecretHash))
    return null
  if (!validateRedirectUri(client, params.redirectUri)) return null

  const [row] = await db
    .select()
    .from(oauthAuthorizationCodes)
    .where(
      and(
        eq(oauthAuthorizationCodes.code, params.code),
        eq(oauthAuthorizationCodes.clientId, client.id),
        eq(oauthAuthorizationCodes.used, false)
      )
    )
  if (!row) return null
  if (row.expiresAt.getTime() < Date.now()) return null
  if (row.redirectUri !== params.redirectUri) return null

  const codeChallenge = row.codeChallenge ?? null
  const codeChallengeMethod = row.codeChallengeMethod ?? null
  if (codeChallenge) {
    const verifier = params.codeVerifier?.trim()
    if (!verifier) return null
    const method = (codeChallengeMethod ?? 'S256').toLowerCase()
    if (method === 's256') {
      const expected = computeS256Challenge(verifier)
      if (expected !== codeChallenge) return null
    } else if (method === 'plain') {
      if (verifier !== codeChallenge) return null
    } else return null
  }

  await db
    .update(oauthAuthorizationCodes)
    .set({ used: true })
    .where(eq(oauthAuthorizationCodes.id, row.id))

  return { personId: row.personId, scopes: row.scopes }
}

/** Issue access token. */
export async function createAccessToken(params: {
  clientId: number
  personId: number
  scopes: string
}) {
  const token = generateId(TOKEN_BYTES)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)
  await db.insert(oauthAccessTokens).values({
    token,
    clientId: params.clientId,
    personId: params.personId,
    scopes: params.scopes,
    expiresAt,
  })
  return { access_token: token, expires_in: Math.floor(TOKEN_TTL_MS / 1000) }
}

/** Validate Bearer token; return personId and scopes or null. */
export async function verifyAccessToken(
  token: string
): Promise<{ personId: number; scopes: string[] } | null> {
  const [row] = await db
    .select()
    .from(oauthAccessTokens)
    .where(eq(oauthAccessTokens.token, token))
  if (!row || row.expiresAt.getTime() < Date.now()) return null
  return {
    personId: row.personId,
    scopes: row.scopes.trim().split(/\s+/).filter(Boolean),
  }
}

/** Store consent for future authorizations. */
export async function saveConsent(params: {
  personId: number
  clientId: number
  scopes: string
}) {
  await db.insert(oauthConsents).values({
    personId: params.personId,
    clientId: params.clientId,
    scopes: params.scopes,
  })
}

/** Get prior consent for this person + client (optional: pre-checked scopes). */
export async function getConsent(
  personId: number,
  clientId: number
): Promise<string | null> {
  const rows = await db
    .select({ scopes: oauthConsents.scopes })
    .from(oauthConsents)
    .where(
      and(
        eq(oauthConsents.personId, personId),
        eq(oauthConsents.clientId, clientId)
      )
    )
    .orderBy(desc(oauthConsents.createdAt))
  return rows.length > 0 ? rows[0].scopes : null
}

export function scopeDescriptions(): Record<Scope, string> {
  return {
    facts: 'Basic facts about you (e.g. name, date of birth)',
    activities: 'Your activity history and categories',
    training: 'Your training and education history',
  }
}
