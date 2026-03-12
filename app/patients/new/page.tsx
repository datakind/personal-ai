import { PatientForm } from '@/app/patients/components/PatientForm';

export default function NewPatientPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-2xl flex-col py-16 px-8 bg-white dark:bg-black">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            New Patient
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create a new patient record
          </p>
        </div>

        <PatientForm />
      </main>
    </div>
  );
}
