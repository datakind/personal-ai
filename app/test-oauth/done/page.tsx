import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifyAccessToken } from '@/lib/oauth'
import FetchDataButtons from './FetchDataButtons'

const TEST_TOKEN_COOKIE = 'test_oauth_token'
const TEST_SCOPES_COOKIE = 'test_oauth_scopes'

export default async function TestOAuthDonePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string; scopes?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const token = cookieStore.get(TEST_TOKEN_COOKIE)?.value

  if (params.error) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <h1 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            OAuth error
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            {params.error}
            {params.error_description ? `: ${params.error_description}` : ''}
          </p>
          <Link
            href="/test-oauth"
            className="inline-block mt-4 text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
          >
            Try again
          </Link>
        </div>
      </main>
    )
  }

  if (!token) {
    redirect('/test-oauth')
  }

  const payload = await verifyAccessToken(token)
  const scopesFromToken = payload?.scopes?.length ? payload.scopes : null
  const scopesParam = params.scopes
  const scopesCookie = cookieStore.get(TEST_SCOPES_COOKIE)?.value
  // Prefer scopes from this redirect (URL or cookie) so the UI matches what was just granted.
  // Token is only used when arriving without redirect params (e.g. refresh).
  const scopesFromRedirect =
    (scopesParam?.trim() && scopesParam.trim().split(/\s+/).filter(Boolean)) ||
    (scopesCookie?.trim() && scopesCookie.trim().split(/\s+/).filter(Boolean)) ||
    null
  const defaultScopes = ['facts', 'activities', 'training']
  const scopes = (scopesFromRedirect?.length ? scopesFromRedirect : null) ?? scopesFromToken ?? defaultScopes

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Token received
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
          You granted access to: <strong>{scopes.join(', ')}</strong>. Click a button below to see the data the training platform can access with this token—the same data it would get when calling the API.
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono break-all mb-6 bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
          {token}
        </p>
        <FetchDataButtons allowedScopes={scopes} />
        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">
            Back to People
          </Link>
        </p>
      </div>
    </main>
  )
}
