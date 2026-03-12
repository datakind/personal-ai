'use client';

import { useFormStatus } from 'react-dom';
import { login } from '@/app/actions/auth';
import { useActionState } from 'react';

/**
 * Submit button component that displays loading state during form submission.
 * Uses useFormStatus hook to access the pending state of the parent form.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  );
}

/**
 * Login form Client Component.
 * Provides an interactive form for user authentication with name and email fields.
 * Displays validation errors and loading states during submission.
 */
export function LoginForm() {
  // Wrap the login action to match useActionState signature
  async function loginAction(
    _prevState: { error?: string } | undefined,
    formData: FormData
  ) {
    return await login(formData);
  }

  const [state, formAction] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="space-y-4">
        {/* Name input field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter your name"
          />
        </div>

        {/* Email input field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter your email"
          />
        </div>
      </div>

      {/* Display validation errors from Server Action */}
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{state.error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Submit button with loading state */}
      <SubmitButton />
    </form>
  );
}
