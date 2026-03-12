'use client';

import { initiateLinking } from '@/app/actions/oauth';
import { useState } from 'react';

/**
 * Client Component for initiating OAuth account linking.
 * 
 * Provides a button that calls the initiateLinking Server Action
 * and handles the pending state during the redirect process.
 */
export function LinkAccountButton() {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    const result = await initiateLinking();

    if (result.error) {
      alert(result.error);
      setPending(false);
    }
    // If successful, user will be redirected to authorization URL
    // No need to reset pending state as page will navigate away
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Redirecting...' : 'Link Account'}
    </button>
  );
}
