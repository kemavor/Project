import React, { useState } from "react";
import { Course, CourseFile } from "../hooks/useCourses";

interface CourseCardProps {
  course: Course;
  onApply: (course: Course) => Promise<void>;
  applying: number | null;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onApply, applying }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  // Provide default values for missing properties
  const courseData = {
    name: course.name || course.title || "Untitled Course",
    title: course.title || course.name || "Untitled Course",
    year: course.year || 1,
    credits: course.credits || 0,
    description: course.description || "No description available",
    instructor: course.instructor || "Unknown Instructor",
    max_students: course.max_students || 50,
    enrolled_students_count: course.enrolled_students_count || 0,
    available_spots: course.available_spots || (course.max_students || 50) - (course.enrolled_students_count || 0),
    prerequisites: course.prerequisites || "No prerequisites",
    files: course.files || [],
    current_user_application: course.current_user_application || null,
    can_enroll: course.can_enroll || { can_enroll: true, message: "You can enroll in this course" }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const renderFile = (file: CourseFile) => {
    if (file.file_type === 'video') {
      return (
        <div className="mb-2">
          <div className="font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">{file.filename}</div>
          <video controls className="w-full rounded-lg max-h-48" src={file.signed_url} />
        </div>
      );
    }
    // Document (PDF, DOC, etc.)
    return (
      <div className="mb-2">
        <div className="font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">{file.filename}</div>
        <a
          href={file.signed_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
        >
          📄 View/Download
        </a>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {courseData.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Year {courseData.year}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {courseData.credits} Credits
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {courseData.available_spots} spots left
              </span>
            </div>
          </div>
          {courseData.current_user_application && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(courseData.current_user_application.status)}`}>
              {courseData.current_user_application.status_display}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
          {courseData.description}
        </p>

        {/* Files Section */}
        {courseData.files && courseData.files.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              {showFiles ? "Hide" : "Show"} Course Files ({courseData.files.length})
            </button>
            {showFiles && (
              <div className="mt-2 space-y-2">
                {courseData.files.map((file, idx) => (
                  <div key={file.s3_key + idx}>
                    {renderFile(file)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prerequisites */}
        {courseData.prerequisites && courseData.prerequisites !== "No prerequisites" && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
            >
              {showDetails ? "Hide" : "Show"} Prerequisites
            </button>
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {courseData.prerequisites}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {courseData.enrolled_students_count} / {courseData.max_students} enrolled
          </div>
          
          {courseData.current_user_application ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Application submitted
            </div>
          ) : courseData.can_enroll.can_enroll ? (
            <button
              onClick={() => onApply(course)}
              disabled={applying === course.id}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {applying === course.id ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Apply Now
                </>
              )}
            </button>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {courseData.can_enroll.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}; 