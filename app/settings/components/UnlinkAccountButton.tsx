'use client';

import { unlinkAccount } from '@/app/actions/oauth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Client Component for unlinking OAuth account.
 * 
 * Provides a button that:
 * 1. Confirms the user wants to unlink
 * 2. Calls the unlinkAccount Server Action
 * 3. Refreshes the page to show updated linking status
 */
export function UnlinkAccountButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    // Confirm before unlinking
    if (!confirm('Are you sure you want to unlink your account?')) {
      return;
    }

    setPending(true);
    const result = await unlinkAccount();

    if (result.error) {
      alert(result.error);
      setPending(false);
    } else {
      // Refresh the page to show updated status
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Unlinking...' : 'Unlink Account'}
    </button>
  );
}
