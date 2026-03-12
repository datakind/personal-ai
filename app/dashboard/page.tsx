import { requireSession } from '@/lib/session';
import { logout } from '@/app/auth/actions';

/**
 * Protected dashboard page that requires authentication
 * Requirements: 3.1, 4.2, 5.1, 5.2, 5.3
 */
export default async function DashboardPage() {
  // Enforce authentication - redirects to login if not authenticated (Requirements 3.1, 4.2)
  const { user } = await requireSession();

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header with user info and logout */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Main content area */}
        <div className="mt-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Training Materials</h2>
            <p className="text-gray-600">
              Welcome back! Your training materials will appear here.
            </p>
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-500">
                Training content will be displayed based on your history and linked storage account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
