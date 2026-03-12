import { redirect } from 'next/navigation';
import { getCurrentUser, getUserQualificationStatus } from '@/lib/auth';
import { getTokensForUser, isOAuthConfigured } from '@/lib/oauth';
import { LinkAccountButton } from './components/LinkAccountButton';
import { UnlinkAccountButton } from './components/UnlinkAccountButton';

/**
 * Settings page - Server Component
 * 
 * Displays user account information and OAuth linking status.
 * Conditionally renders linking UI based on OAuth configuration.
 * Shows qualification status for linked users.
 * 
 * Implements Requirements 9.1, 9.3, 9.4, and 1.5:
 * - Displays user's linked account status (9.3)
 * - Hides linking UI when OAuth not configured (9.2)
 * - Shows success/error messages from query parameters (8.1-8.4)
 * - Conditionally renders linking UI based on configuration (1.5)
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; details?: string }>;
}) {
  // Get current authenticated user
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Await search params
  const params = await searchParams;

  // Check if OAuth is configured
  const oauthConfigured = isOAuthConfigured();

  // Query user's token status to determine if linked
  const tokens = oauthConfigured ? await getTokensForUser(user.id) : null;
  const isLinked = !!tokens;

  // Fetch qualification status for linked users
  let qualificationStatus = null;
  if (isLinked) {
    qualificationStatus = await getUserQualificationStatus(user.id);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Settings
        </h1>

        {/* Success message */}
        {params.success === 'account_linked' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">
              ✓ Account successfully linked!
            </p>
          </div>
        )}

        {/* Error messages */}
        {params.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">
              {getErrorMessage(params.error, params.details)}
            </p>
          </div>
        )}

        {/* Account Information Section */}
        <section className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Account Information
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Name:</span> {user.name}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Email:</span> {user.email}
            </p>
          </div>
        </section>

        {/* External Account Linking Section - Only show if OAuth is configured */}
        {oauthConfigured && (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              External Account Linking
            </h2>

            {isLinked ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="font-medium">
                    Your account is linked to the storage system
                  </p>
                </div>

                {/* Show qualification status if available */}
                {qualificationStatus && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">PHQ-9 Qualification:</span>{' '}
                      {qualificationStatus.phq9Qualified ? (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ Qualified
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          ✗ Not Qualified
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <UnlinkAccountButton />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Link your account to access PHQ-9 assessments (if qualified)
                </p>
                <LinkAccountButton />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * Maps error codes to user-friendly error messages.
 * 
 * Implements Requirements 8.1, 8.2, 8.3, and 8.4:
 * - Displays message when user denies authorization (8.1)
 * - Displays message for network errors (8.2)
 * - Displays message for invalid credentials (8.3)
 * - Displays security error for state validation failures (8.4)
 * 
 * @param error - The error code from query parameters
 * @param details - Optional additional error details
 * @returns User-friendly error message
 */
function getErrorMessage(error: string, details?: string): string {
  const messages: Record<string, string> = {
    oauth_not_configured: 'OAuth is not configured on this server',
    authorization_denied: 'You declined to authorize the application',
    invalid_callback: 'Invalid callback parameters received',
    invalid_state: 'Security validation failed. Please try again.',
    token_exchange_failed: 'Failed to complete linking. Please try again.',
  };

  const baseMessage = messages[error] || 'An unknown error occurred';
  
  // Append details if provided
  if (details) {
    return `${baseMessage} (${details})`;
  }

  return baseMessage;
}
