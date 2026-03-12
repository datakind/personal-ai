import { redirect } from 'next/navigation';
import { getPatient } from '@/app/actions/patients';
import AssessmentForm from '../../components/AssessmentForm';

export default async function AssessmentWorkflowPage({
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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Assessment for {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-gray-600">
            Complete the PHQ-2 screening questionnaire to begin
          </p>
        </div>

        {/* Assessment Form */}
        <AssessmentForm patientId={id} />
      </div>
    </div>
  );
}
