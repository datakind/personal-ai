import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPatient } from '@/app/actions/patients';
import { getAssessmentHistory } from '@/app/actions/assessments';
import AssessmentHistory from '../components/AssessmentHistory';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const id = parseInt(patientId, 10);

  // Validate patient ID
  if (isNaN(id)) {
    redirect('/patients');
  }

  // Fetch patient data
  const patient = await getPatient(id);

  // Handle patient not found
  if (!patient) {
    redirect('/patients');
  }

  // Fetch assessment history
  const assessmentHistory = await getAssessmentHistory(id);

  // Format date of birth
  const dobFormatted = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(patient.dateOfBirth);

  // Format creation date
  const createdFormatted = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(patient.createdAt);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/patients"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Patients
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {patient.firstName} {patient.lastName}
          </h1>
          <div className="text-gray-600 space-y-1">
            <p>Date of Birth: {dobFormatted}</p>
            <p>Patient Since: {createdFormatted}</p>
          </div>
        </div>

        {/* Start New Assessment Button */}
        <div className="mb-8">
          <Link
            href={`/patients/${id}/assess`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start New Assessment
          </Link>
        </div>

        {/* Assessment History */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Assessment History</h2>
          <AssessmentHistory assessments={assessmentHistory} />
        </div>
      </div>
    </div>
  );
}
