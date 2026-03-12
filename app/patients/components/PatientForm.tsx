'use client';

import { useFormStatus } from 'react-dom';
import { createPatient } from '@/app/actions/patients';
import { redirect } from 'next/navigation';
import { useState } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? 'Creating...' : 'Create Patient'}
    </button>
  );
}

export function PatientForm() {
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setFieldError(null);
    
    const result = await createPatient(formData);
    
    if (!result.success) {
      setError(result.error || 'Failed to create patient');
      setFieldError(result.field || null);
      return;
    }
    
    // Redirect to patients list on success
    redirect('/patients');
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && !fieldError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          required
          className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 dark:text-zinc-100 dark:placeholder-zinc-500 ${
            fieldError === 'firstName'
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-red-950 dark:focus:border-red-400 dark:focus:ring-red-400'
              : 'border-zinc-300 bg-white focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-400'
          }`}
          placeholder="Enter first name"
        />
        {fieldError === 'firstName' && error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          required
          className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 dark:text-zinc-100 dark:placeholder-zinc-500 ${
            fieldError === 'lastName'
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-red-950 dark:focus:border-red-400 dark:focus:ring-red-400'
              : 'border-zinc-300 bg-white focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-400'
          }`}
          placeholder="Enter last name"
        />
        {fieldError === 'lastName' && error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="dateOfBirth"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Date of Birth
        </label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          required
          max={new Date().toISOString().split('T')[0]}
          className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 dark:text-zinc-100 dark:placeholder-zinc-500 ${
            fieldError === 'dateOfBirth'
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-red-950 dark:focus:border-red-400 dark:focus:ring-red-400'
              : 'border-zinc-300 bg-white focus:border-zinc-500 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-400'
          }`}
        />
        {fieldError === 'dateOfBirth' && error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
