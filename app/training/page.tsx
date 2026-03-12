import { requireSession } from '@/lib/session';
import { getUserCompletionHistory } from '@/lib/training';
import { db } from '@/db';
import type { TrainingMaterial } from '@/db/schema';
import Link from 'next/link';

/**
 * Enriched training material with completion status
 */
type TrainingListItem = TrainingMaterial & {
  completed: boolean;
};

/**
 * Fetches all training materials and enriches them with user completion status.
 * Sorts materials with uncompleted first, then completed.
 * 
 * @param userId - The ID of the current user
 * @returns Array of training materials with completion status, sorted by completion
 * 
 * Validates:
 * - Requirements 1.1: Display all training materials from the Database
 * - Requirements 1.5: Indicate which training materials the current User has completed
 * - Requirements 1.6: Order training materials with uncompleted items first, followed by completed items
 * - Requirements 4.1: Retrieve the current User identifier from the session
 * - Requirements 7.1: Use Server Components for data fetching
 * - Requirements 7.4: Use Drizzle ORM relational queries
 */
async function getTrainingListData(userId: number): Promise<TrainingListItem[]> {
  // Fetch all training materials
  const materials = await db.query.trainingMaterials.findMany({
    orderBy: (materials, { asc }) => [asc(materials.title)],
  });

  // Fetch user completion history
  const completions = await getUserCompletionHistory(userId);
  const completedIds = new Set(completions.map((c) => c.materialId));

  // Merge data to create enriched list with completion status
  const enriched: TrainingListItem[] = materials.map((material) => ({
    ...material,
    completed: completedIds.has(material.id),
  }));

  // Sort materials: uncompleted first, then completed
  return enriched.sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
}

/**
 * Training list page Server Component
 * Displays all available training materials with completion status
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 5.1, 7.1
 */
export default async function TrainingPage() {
  // Enforce authentication - redirects to login if not authenticated
  const { user } = await requireSession();

  // Fetch training materials and user completion history
  const trainingList = await getTrainingListData(user.id);

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold">Training Materials</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Training materials list */}
        <div className="mt-8 space-y-4">
          {trainingList.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-gray-600">No training materials available.</p>
            </div>
          ) : (
            trainingList.map((material) => (
              <Link
                key={material.id}
                href={`/training/${material.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">
                      {material.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Category: {material.categoryId}
                    </p>
                  </div>
                  {material.completed && (
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                        ✓ Completed
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
