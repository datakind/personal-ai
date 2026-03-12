'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitPHQ2, submitPHQ9 } from '@/app/actions/assessments';

interface AssessmentFormProps {
  patientId: number;
}

type WorkflowState = 'phq2' | 'phq2-complete' | 'phq9' | 'complete' | 'not-qualified';

const PHQ2_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
];

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];

const RESPONSE_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

export default function AssessmentForm({ patientId }: AssessmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workflowState, setWorkflowState] = useState<WorkflowState>('phq2');
  const [phq2Responses, setPHQ2Responses] = useState<(number | null)[]>([null, null]);
  const [phq9Responses, setPHQ9Responses] = useState<(number | null)[]>(Array(9).fill(null));
  const [phq2Score, setPHQ2Score] = useState<number | null>(null);
  const [phq9Score, setPHQ9Score] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePHQ2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all questions are answered
    if (phq2Responses.some((r) => r === null)) {
      setError('Please answer all questions');
      return;
    }

    const responses = phq2Responses as number[];

    startTransition(async () => {
      const result = await submitPHQ2(patientId, responses);

      if (!result.success) {
        setError(result.error || 'Failed to submit PHQ-2 assessment');
        return;
      }

      setPHQ2Score(result.score!);

      // Determine next state based on score and qualification
      if (result.score! < 3) {
        setWorkflowState('complete');
      } else if (result.requiresPHQ9 && result.userQualified) {
        setWorkflowState('phq9');
      } else if (result.requiresPHQ9 && !result.userQualified) {
        setWorkflowState('not-qualified');
      }
    });
  };

  const handlePHQ9Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all questions are answered
    if (phq9Responses.some((r) => r === null)) {
      setError('Please answer all questions');
      return;
    }

    const responses = phq9Responses as number[];

    startTransition(async () => {
      const result = await submitPHQ9(patientId, responses);

      if (!result.success) {
        setError(result.error || 'Failed to submit PHQ-9 assessment');
        return;
      }

      setPHQ9Score(result.score!);
      setWorkflowState('complete');
    });
  };

  const handleReturnToPatient = () => {
    router.push(`/patients/${patientId}`);
  };

  // PHQ-2 Form
  if (workflowState === 'phq2') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">PHQ-2 Assessment</h2>
        <p className="text-gray-600 mb-6">
          Over the last 2 weeks, how often have you been bothered by any of the following problems?
        </p>

        <form onSubmit={handlePHQ2Submit}>
          {PHQ2_QUESTIONS.map((question, index) => (
            <div key={index} className="mb-8">
              <p className="font-medium mb-4">
                {index + 1}. {question}
              </p>
              <div className="space-y-2">
                {RESPONSE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`phq2-q${index}`}
                      value={option.value}
                      checked={phq2Responses[index] === option.value}
                      onChange={() => {
                        const newResponses = [...phq2Responses];
                        newResponses[index] = option.value;
                        setPHQ2Responses(newResponses);
                      }}
                      className="w-4 h-4 text-blue-600"
                      disabled={isPending}
                    />
                    <span className="text-gray-700">
                      {option.value} - {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isPending ? 'Submitting...' : 'Submit PHQ-2'}
          </button>
        </form>
      </div>
    );
  }

  // PHQ-9 Form
  if (workflowState === 'phq9') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">PHQ-9 Assessment</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              PHQ-2 Score: <span className="font-bold">{phq2Score}</span> - Extended assessment required
            </p>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Over the last 2 weeks, how often have you been bothered by any of the following problems?
        </p>

        <form onSubmit={handlePHQ9Submit}>
          {PHQ9_QUESTIONS.map((question, index) => (
            <div key={index} className="mb-8">
              <p className="font-medium mb-4">
                {index + 1}. {question}
              </p>
              <div className="space-y-2">
                {RESPONSE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`phq9-q${index}`}
                      value={option.value}
                      checked={phq9Responses[index] === option.value}
                      onChange={() => {
                        const newResponses = [...phq9Responses];
                        newResponses[index] = option.value;
                        setPHQ9Responses(newResponses);
                      }}
                      className="w-4 h-4 text-blue-600"
                      disabled={isPending}
                    />
                    <span className="text-gray-700">
                      {option.value} - {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isPending ? 'Submitting...' : 'Submit PHQ-9'}
          </button>
        </form>
      </div>
    );
  }

  // Not Qualified Message
  if (workflowState === 'not-qualified') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Assessment Complete</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-sm text-blue-800">
              PHQ-2 Score: <span className="font-bold">{phq2Score}</span>
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 mb-6">
            <p className="text-yellow-800 font-medium mb-2">PHQ-9 Assessment Required</p>
            <p className="text-yellow-700 text-sm">
              This patient requires a PHQ-9 assessment, but you are not qualified to administer it. 
              Please have a PHQ-9 qualified staff member complete the assessment.
            </p>
          </div>
          <button
            onClick={handleReturnToPatient}
            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
          >
            Return to Patient
          </button>
        </div>
      </div>
    );
  }

  // Complete Message
  if (workflowState === 'complete') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Assessment Complete</h2>
          <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
            <p className="text-green-800 font-medium mb-4">Assessment successfully submitted</p>
            <div className="space-y-2">
              <p className="text-sm text-green-700">
                PHQ-2 Score: <span className="font-bold">{phq2Score}</span>
              </p>
              {phq9Score !== null && (
                <p className="text-sm text-green-700">
                  PHQ-9 Score: <span className="font-bold">{phq9Score}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleReturnToPatient}
            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
          >
            Return to Patient
          </button>
        </div>
      </div>
    );
  }

  return null;
}
