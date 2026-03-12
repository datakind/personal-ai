import { requireSession } from '@/lib/session';
import { logout } from '@/app/auth/actions';
import Link from 'next/link';

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
            <p className="text-gray-600 mb-4">
              Welcome back! Access your training materials to continue learning.
            </p>
            <Link
              href="/training"
              className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              View Training Materials
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
