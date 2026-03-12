import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import LoginForm from './login-form';

/**
 * Login page Server Component
 * Requirements: 1.1, 1.6, 4.5, 9.2
 * 
 * - Checks for existing session and redirects authenticated users to dashboard
 * - Extracts returnUrl from searchParams for post-login redirect
 * - Displays session expiration message when sessionExpired flag is present
 * - Renders login form with email input
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string; sessionExpired?: string }>;
}) {
  // Check for existing session and redirect if authenticated (Requirement 1.6)
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  // Extract returnUrl and sessionExpired from searchParams (Requirements 4.5, 9.2)
  const { returnUrl, sessionExpired } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold">Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email to access your training
          </p>
        </div>
        
        {/* Display session expiration message (Requirement 9.2) */}
        {sessionExpired === 'true' && (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Your session has expired. Please sign in again.
          </div>
        )}
        
        <LoginForm returnUrl={returnUrl} />
      </div>
    </div>
  );
}
