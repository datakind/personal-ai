/**
 * Email prompt page for migrated users
 * 
 * This page is shown to users who were migrated from the legacy system
 * and need to provide their email address for the new authentication system.
 * 
 * Requirements: 6.4
 */

import { requireSession, needsEmailPrompt } from '@/lib/session';
import { redirect } from 'next/navigation';
import EmailPromptForm from './email-prompt-form';

export default async function EmailPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  // Don't check email prompt in requireSession to avoid redirect loop
  const { user } = await requireSession(false);
  const { returnUrl } = await searchParams;

  // Check if user actually needs email prompt
  if (!needsEmailPrompt(user.email)) {
    // User already has a real email, redirect to dashboard or return URL
    redirect(returnUrl || '/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold">Welcome Back!</h2>
          <p className="mt-2 text-sm text-gray-600">
            We've upgraded our authentication system. Please provide your email
            address to continue accessing your training materials.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Your training history and linked accounts have been preserved.
          </p>
        </div>
        <EmailPromptForm userId={user.id} returnUrl={returnUrl} />
      </div>
    </div>
  );
}
