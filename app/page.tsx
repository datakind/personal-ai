import { getCurrentUser } from '@/lib/auth';
import { LogoutButton } from '@/app/components/LogoutButton';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Patient Health Reporting
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This route is protected by authentication middleware
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Authenticated User
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-black dark:text-zinc-50">User ID:</span> {user?.id}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-black dark:text-zinc-50">Name:</span> {user?.name}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-black dark:text-zinc-50">Email:</span> {user?.email}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-black dark:text-zinc-50">Registered:</span>{' '}
                {user?.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            You are viewing this page because you have a valid session. The middleware automatically
            redirects unauthenticated users to the login page.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}
