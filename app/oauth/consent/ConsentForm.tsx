'use client'

import { useActionState, useRef, useState } from 'react'
import type { Scope } from '@/db/schema'
import { submitConsent, type ConsentResult } from './actions'

type Props = {
  clientId: string
  redirectUri: string
  state?: string
  scopeParam?: string
  codeChallenge?: string
  codeChallengeMethod?: string
  scopes: Scope[]
  descriptions: Record<Scope, string>
}

function consentAction(_prev: ConsentResult, formData: FormData): Promise<ConsentResult> {
  return submitConsent(formData)
}

export default function ConsentForm({ clientId, redirectUri, state, scopeParam, codeChallenge, codeChallengeMethod, scopes, descriptions }: Props) {
  const [result, formAction, isPending] = useActionState(consentAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedPending, setSelectedPending] = useState(false)
  const [selectedError, setSelectedError] = useState<string | null>(null)

  async function handleAllowSelected(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    const form = formRef.current
    if (!form) return
    const checked: string[] = []
    scopes.forEach((scope) => {
      const el = form.elements.namedItem(`allow_${scope}`)
      if (el && 'checked' in el && (el as HTMLInputElement).checked) {
        checked.push(scope)
      }
    })
    if (checked.length === 0) return
    setSelectedPending(true)
    setSelectedError(null)
    try {
      const body = new FormData(form)
      body.set('allowed_scopes', checked.join(' '))
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        body,
        headers: { 'X-Response-Mode': 'json' },
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSelectedError(data.error_description ?? data.error ?? `Request failed (${res.status})`)
        return
      }
      if (data.redirect_url) {
        window.location.href = data.redirect_url
        return
      }
    } finally {
      setSelectedPending(false)
    }
  }

  return (
    <form ref={formRef} className="space-y-4" action={formAction}>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="redirect_uri" value={redirectUri} />
      <input type="hidden" name="allowed_scopes" value="" />
      {state != null && <input type="hidden" name="state" value={state} />}
      {scopeParam != null && <input type="hidden" name="scope" value={scopeParam} />}
      {codeChallenge != null && <input type="hidden" name="code_challenge" value={codeChallenge} />}
      {codeChallengeMethod != null && <input type="hidden" name="code_challenge_method" value={codeChallengeMethod} />}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Allow access to (only checked items will be shared):
        </label>
        <div className="space-y-2 pl-1">
          {scopes.map((scope) => (
            <label key={scope} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name={`allow_${scope}`}
                value="1"
                className="mt-1 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 focus:ring-zinc-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                <span className="font-medium capitalize">{scope}</span>
                <span className="block text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                  {descriptions[scope]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {(result?.error ?? selectedError) && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {result?.error ?? selectedError}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          type="submit"
          name="allow_all"
          value="1"
          disabled={isPending || selectedPending}
          className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {isPending ? '…' : 'Allow all'}
        </button>
        <button
          type="button"
          disabled={isPending || selectedPending}
          onClick={handleAllowSelected}
          className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {isPending ? '…' : 'Allow selected'}
        </button>
        <button
          type="submit"
          name="deny"
          value="1"
          disabled={isPending || selectedPending}
          className="px-4 py-2.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          Deny
        </button>
      </div>
    </form>
  )
}
