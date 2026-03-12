'use client';

import { logout } from '@/app/actions/auth';
import { useFormStatus } from 'react-dom';

/**
 * Submit button component that displays loading state during form submission.
 * Must be a separate component to use useFormStatus hook.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
    >
      {pending ? 'Logging out...' : 'Logout'}
    </button>
  );
}

/**
 * Logout button component that calls the logout Server Action.
 * Uses a form with progressive enhancement for accessibility and reliability.
 */
export function LogoutButton() {
  return (
    <form action={logout}>
      <SubmitButton />
    </form>
  );
}
