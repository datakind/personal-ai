import { requireSession } from '@/lib/session';
import { hasUserCompletedMaterial } from '@/lib/training';
import { db } from '@/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { completeTraining } from './actions';

/**
 * Training detail page Server Component
 * Displays full training material content with completion functionality
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.4, 4.2, 5.2, 7.2
 */
export default async function TrainingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ completed?: string; error?: string }>;
}) {
  // Enforce authentication - redirects to login if not authenticated
  const { user } = await requireSession();
  
  // Extract material ID from params
  const { id } = await params;
  const materialId = parseInt(id, 10);
  
  // Validate material ID is a valid integer
  if (isNaN(materialId)) {
    notFound();
  }

  // Fetch training material by ID
  const material = await db.query.trainingMaterials.findFirst({
    where: (materials, { eq }) => eq(materials.id, materialId)
  });

  // Handle not found case
  if (!material) {
    notFound();
  }

  // Check user completion status
  const completed = await hasUserCompletedMaterial(user.id, materialId);

  // Extract success message from search params
  const { completed: completedParam, error: errorParam } = await searchParams;

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        {/* Success message */}
        {completedParam === 'true' && (
          <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-800">
            Training marked as complete!
          </div>
        )}

        {/* Error message */}
        {errorParam && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
            {errorParam === 'invalid_id' 
              ? 'Invalid training material ID' 
              : decodeURIComponent(errorParam)}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/training"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Training List
          </Link>
        </div>

        {/* Main content area */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold mb-4">{material.title}</h1>
          <div className="mb-4">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
              {material.categoryId}
            </span>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{material.content}</p>
          </div>
          
          {/* Completion status */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {completed ? (
              <div className="flex items-center text-green-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Completed</span>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">Mark this training as complete when you finish reviewing the content.</p>
                <form action={completeTraining}>
                  <input type="hidden" name="materialId" value={materialId} />
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Mark as Complete
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
