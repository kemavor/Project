import React from "react";
import { useMyApplications } from "../hooks/useMyApplications";

export const MyApplications: React.FC = () => {
  const { applications, loading, error } = useMyApplications();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No applications yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't applied for any courses yet.
            </p>
            <a
              href="/courses"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Browse Courses
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          My Course Applications
        </h2>
        
        <div className="grid gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {app.course.name} (Year {app.course.year})
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {app.course.description}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    app.status === 'enrolled' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    app.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {app.status_display}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Applied:</span>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(app.application_date).toLocaleDateString()}
                    </p>
                  </div>
                  {app.decision_date && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Decision:</span>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(app.decision_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Student Year:</span>
                    <p className="text-gray-900 dark:text-white">Year {app.student_year}</p>
                  </div>
                  {app.gpa && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">GPA:</span>
                      <p className="text-gray-900 dark:text-white">{app.gpa}</p>
                    </div>
                  )}
                </div>

                {app.motivation_statement && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Motivation:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {app.motivation_statement}
                    </p>
                  </div>
                )}

                {app.notes && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {app.notes}
                    </p>
                  </div>
                )}

                {app.course.signed_url && (
                  <div>
                    <a
                      href={app.course.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Course Document: {app.course.document_filename}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 