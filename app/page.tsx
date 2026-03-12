import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Image from "next/image";

/**
 * Home page that redirects authenticated users to dashboard
 * Requirements: 3.1, 4.2
 */
export default async function Home() {
  // Check if user is authenticated (Requirements 3.1)
  const session = await getSession();
  
  // Redirect authenticated users to dashboard (Requirements 4.2)
  if (session) {
    redirect('/dashboard');
  }

  // Show landing page for unauthenticated users
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Training
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Access your personalized training materials and track your progress.
            Sign in to get started.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="/login"
          >
            Sign In
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="/dashboard"
          >
            View Dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
