import { cookies } from 'next/headers'
import { createHmac, randomBytes } from 'node:crypto'

const COOKIE_NAME = 'personal_ai_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-in-production'

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('hex')
}

function encodeSession(personId: number): string {
  const payload = JSON.stringify({
    personId,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  })
  const encoded = Buffer.from(payload, 'utf8').toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

function decodeSession(token: string): { personId: number } | null {
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig || sign(encoded) !== sig) return null
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as { personId: number; exp: number }
    if (payload.exp < Date.now()) return null
    return { personId: payload.personId }
  } catch {
    return null
  }
}

export async function getSession(): Promise<{ personId: number } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function setSession(personId: number): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, encodeSession(personId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
