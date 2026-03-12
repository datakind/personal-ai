import type { Assessment, User } from '@/db/schema';

interface AssessmentWithUser extends Assessment {
  user: User;
}

interface AssessmentHistoryProps {
  assessments: AssessmentWithUser[];
}

export default function AssessmentHistory({ assessments }: AssessmentHistoryProps) {
  if (assessments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No assessments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assessments.map((assessment) => {
        const completedFormatted = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(assessment.completedAt);

        return (
          <div
            key={assessment.id}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {assessment.assessmentType}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Completed: {completedFormatted}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Staff Member: {assessment.user.name}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {assessment.totalScore}
                </div>
                <div className="text-sm text-gray-500">
                  {assessment.assessmentType === 'PHQ-2' ? '/ 6' : '/ 27'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
