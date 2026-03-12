/**
 * Loading state for training pages
 * Displays skeleton UI while data is being fetched
 * Requirements: 5.5
 */
export default function TrainingLoading() {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="h-9 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Content skeleton */}
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
