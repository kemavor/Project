import React, { useState } from "react";
import { useCourses, Course } from "../hooks/useCourses";
import { CourseCard } from "./CourseCard";
import { apiClient } from "../lib/api";

export const CourseCatalog: React.FC = () => {
  const { courses, loading, error } = useCourses();
  const [applying, setApplying] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const handleApply = async (course: Course) => {
    setApplying(course.id);
    setMessage(null);

    try {
      const response = await apiClient.applyForCourse(course.id, {
        student_year: course.year || 1,
        gpa: 4.0,
        motivation_statement: "I am interested in this course and believe it will help me achieve my academic goals.",
      });

      if (response.error) {
        setMessage({ text: response.error, type: "error" });
      } else {
        setMessage({ text: "Application submitted successfully!", type: "success" });
        // Refresh courses to update application status
        window.location.reload();
      }
    } catch (error) {
      setMessage({ text: "Network error. Please check your connection.", type: "error" });
    } finally {
      setApplying(null);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((course: Course) => {
    const matchesYear = selectedYear === "all" || course.year === selectedYear;
    const matchesSearch = (course.name || course.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesYear && matchesSearch;
  });

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Course Catalog
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Discover and apply for courses that match your interests and academic goals
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200"
          }`}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Year Filter */}
          <div className="sm:w-48">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Years</option>
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
              <option value={4}>Year 4</option>
            </select>
          </div>
        </div>

        {/* Course Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredCourses.length} of {courses.length} courses
          </p>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: Course) => (
              <CourseCard
                key={course.id}
                course={course}
                onApply={handleApply}
                applying={applying}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 