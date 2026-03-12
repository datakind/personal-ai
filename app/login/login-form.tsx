'use client'

import { authenticate } from '@/app/auth/actions';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';

/**
 * Submit button component that shows loading state during form submission
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? 'Signing in...' : 'Sign In'}
    </button>
  );
}

/**
 * Login form Client Component
 * Requirements: 1.1, 1.3, 9.1
 * 
 * - Renders email input field
 * - Handles form submission via Server Action
 * - Displays validation errors
 */
export default function LoginForm({ returnUrl }: { returnUrl?: string }) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await authenticate(formData, returnUrl);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="you@example.com"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
