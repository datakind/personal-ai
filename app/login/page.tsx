import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from './components/LoginForm';

/**
 * Login page Server Component.
 * Checks if user is already authenticated and redirects to home if so.
 * Otherwise, renders the login form for user authentication.
 */
export default async function LoginPage() {
  // Check if user is already authenticated
  const user = await getCurrentUser();

  // Redirect to home page if already authenticated
  // Note: Middleware also handles this, but good practice to check here too
  if (user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your details to access the patient health reporting system
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
