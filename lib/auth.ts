import { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/oauth'
import type { Scope } from '@/db/schema'

/** Get Bearer token from Authorization header. */
export function getBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7).trim() || null
}

/** Require valid Bearer token and optional scope. Returns payload or null. */
export async function requireAuth(
  request: NextRequest,
  scope?: Scope
): Promise<{ personId: number; scopes: string[] } | null> {
  const token = getBearerToken(request)
  if (!token) return null
  const payload = await verifyAccessToken(token)
  if (!payload) return null
  if (scope && !payload.scopes.includes(scope)) return null
  return payload
}
