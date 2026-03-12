import Link from 'next/link';
import { getPatients } from '@/app/actions/patients';

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-5xl flex-col py-16 px-8 bg-white dark:bg-black">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Patients
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Manage patient records and assessments
            </p>
          </div>
          <Link
            href="/patients/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            New Patient
          </Link>
        </div>

        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              No patients found. Create your first patient to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Date of Birth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-black">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black dark:text-zinc-50">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {patient.dateOfBirth.toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {patient.createdAt.toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <Link
                        href={`/patients/${patient.id}/assess`}
                        className="inline-block rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                      >
                        Start Assessment
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
