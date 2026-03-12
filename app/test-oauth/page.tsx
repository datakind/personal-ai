import Link from 'next/link'

/** Start route generates state, sets cookie, redirects to authorize (state verified at callback). */
const startUrl = (prompt?: string) => {
  const url = '/api/test-oauth/start'
  return prompt ? `${url}?prompt=${encodeURIComponent(prompt)}` : url
}

export default function TestOAuthPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Test OAuth flow
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
          This page simulates the training platform. You’ll sign in, choose what to share on the consent screen, then get an access token and call the
          {' '}
          <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">/api/people/me/*</code> endpoints. State is generated and verified to mitigate CSRF. (For production, clients must send a random <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">state</code> and verify it on their callback.)
        </p>
        <a
          href={startUrl('consent')}
          className="block w-full text-center px-4 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Start OAuth flow
        </a>
        <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
          If you’ve already authorized, You will always see the consent screen so you can choose exactly which data to share (facts, activities, training).
        </p>
        <a
          href={startUrl()}
          className="mt-4 block w-full text-center px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Skip consent (use my previous choices)
        </a>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">
            Back to People
          </Link>
        </p>
      </div>
    </main>
  )
}
