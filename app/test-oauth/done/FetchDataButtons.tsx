'use client'

import { useState } from 'react'

type Endpoint = 'facts' | 'activities' | 'training'

const ALL_ENDPOINTS: Endpoint[] = ['facts', 'activities', 'training']

type Props = { allowedScopes?: string[] }

export default function FetchDataButtons({ allowedScopes }: Props) {
  const endpoints = allowedScopes?.length
    ? (ALL_ENDPOINTS.filter((e) => allowedScopes.includes(e)) as Endpoint[])
    : ALL_ENDPOINTS

  const [results, setResults] = useState<Record<Endpoint, string | null>>({
    facts: null,
    activities: null,
    training: null,
  })
  const [lastFetched, setLastFetched] = useState<Endpoint | null>(null)
  const [loading, setLoading] = useState<Endpoint | null>(null)

  async function fetchEndpoint(endpoint: Endpoint) {
    setLoading(endpoint)
    setResults((prev) => ({ ...prev, [endpoint]: null }))
    try {
      const res = await fetch(`/api/test-oauth/proxy?endpoint=${encodeURIComponent(endpoint)}`, { credentials: 'include', cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      const text = res.ok
        ? JSON.stringify(data, null, 2)
        : `HTTP ${res.status}: ${JSON.stringify(data)}`
      setResults((prev) => ({ ...prev, [endpoint]: text }))
      setLastFetched(endpoint)
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [endpoint]: e instanceof Error ? e.message : 'Request failed',
      }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        See what the app can read with your token:
      </p>
      <div className="flex flex-wrap gap-2">
        {endpoints.map((endpoint) => (
          <button
            key={endpoint}
            type="button"
            onClick={() => fetchEndpoint(endpoint)}
            disabled={loading !== null}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading === endpoint ? '…' : `Fetch my ${endpoint}`}
          </button>
        ))}
      </div>
      {lastFetched && results[lastFetched] && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Result for <strong>{lastFetched}</strong>:
          </p>
          <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 p-3 rounded overflow-auto max-h-48">
            {results[lastFetched]}
          </pre>
        </div>
      )}
    </div>
  )
}
