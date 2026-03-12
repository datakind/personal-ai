'use client';

import Link from 'next/link';

/**
 * Error boundary for training pages
 * Catches and displays errors with retry functionality
 * Requirements: 6.1, 6.2
 */
export default function TrainingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-2xl font-bold text-red-900 mb-2">
            Failed to load training materials
          </h2>
          <p className="text-red-800 mb-6">
            There was a problem loading the training content. Please try again.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-900 hover:bg-gray-300 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
