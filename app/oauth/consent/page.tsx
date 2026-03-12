import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getClient, parseScopes, scopeDescriptions } from '@/lib/oauth'
import { SCOPES } from '@/db/schema'
import ConsentForm from './ConsentForm'

type Props = { searchParams: Promise<{ client_id?: string; redirect_uri?: string; scope?: string; state?: string; code_challenge?: string; code_challenge_method?: string }> }

export default async function ConsentPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) {
    redirect('/login?return_to=' + encodeURIComponent('/oauth/consent?' + new URLSearchParams(await searchParams as Record<string, string>).toString()))
  }

  const params = await searchParams
  const clientId = params.client_id
  const redirectUri = params.redirect_uri
  const scopeParam = params.scope
  const state = params.state
  const codeChallenge = params.code_challenge ?? undefined
  const codeChallengeMethod = params.code_challenge_method ?? undefined

  if (!clientId || !redirectUri) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Invalid request</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Missing client_id or redirect_uri.</p>
        </div>
      </main>
    )
  }

  const client = await getClient(clientId)
  if (!client) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Unknown application</h1>
          <p className="text-zinc-600 dark:text-zinc-400">This client is not registered.</p>
        </div>
      </main>
    )
  }

  const requestedScopes = parseScopes(scopeParam ?? null)
  const scopesToShow = requestedScopes.length > 0 ? requestedScopes : [...SCOPES]
  const descriptions = scopeDescriptions()

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Share your data
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
          <strong>{client.name}</strong> wants to access the following from your personal memory. Choose what to allow.
        </p>
        <ConsentForm
          clientId={clientId}
          redirectUri={redirectUri}
          state={state ?? undefined}
          scopeParam={scopeParam ?? undefined}
          codeChallenge={codeChallenge}
          codeChallengeMethod={codeChallengeMethod}
          scopes={scopesToShow}
          descriptions={descriptions}
        />
      </div>
    </main>
  )
}
