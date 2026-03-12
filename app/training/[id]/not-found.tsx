import Link from 'next/link';

/**
 * 404 page for training detail routes
 * Displays when a training material ID doesn't exist
 * Requirements: 2.4
 */
export default function TrainingNotFound() {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Training Material Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The training material you're looking for doesn't exist or has been removed.
          </p>
          
          <Link
            href="/training"
            className="inline-block rounded-md bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-800 transition-colors"
          >
            Back to Training List
          </Link>
        </div>
      </div>
    </div>
  );
}
