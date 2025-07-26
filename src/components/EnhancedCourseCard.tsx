import React, { useState } from "react";
import { Course, CourseFile } from "../hooks/useCourses";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { 
  BookOpen, 
  Users, 
  Clock, 
  Award, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Play,
  Download,
  Eye,
  Calendar,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface EnhancedCourseCardProps {
  course: Course;
  onApply: (course: Course) => Promise<void>;
  applying: number | null;
}

export const EnhancedCourseCard: React.FC<EnhancedCourseCardProps> = ({ 
  course, 
  onApply, 
  applying 
}) => {
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

  const enrollmentPercentage = (courseData.enrolled_students_count / courseData.max_students) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
    }
  };

  const renderFile = (file: CourseFile) => {
    if (file.file_type === 'video') {
      return (
        <div className="group relative bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
                {file.filename}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
          <video 
            controls 
            className="w-full rounded-lg max-h-32 object-cover" 
            src={file.signed_url} 
          />
        </div>
      );
    }
    
    return (
      <div className="group bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
              {file.filename}
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
        <CardHeader className="relative pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {courseData.name}
                </h3>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Year {courseData.year}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{courseData.credits} Credits</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-green-500" />
                  <span>{courseData.available_spots} spots left</span>
                </div>
              </div>

              {/* Enrollment Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Enrollment</span>
                  <span>{courseData.enrolled_students_count}/{courseData.max_students}</span>
                </div>
                <Progress 
                  value={enrollmentPercentage} 
                  className="h-2"
                />
              </div>
            </div>
            
            {courseData.current_user_application && (
              <Badge 
                variant="outline" 
                className={`${getStatusColor(courseData.current_user_application.status)} border`}
              >
                {courseData.current_user_application.status_display}
              </Badge>
            )}
          </div>
        </CardHeader>
      </div>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {courseData.description}
        </p>

        {/* Files Section */}
        {courseData.files && courseData.files.length > 0 && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              onClick={() => setShowFiles(!showFiles)}
              className="w-full justify-between p-0 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Course Files ({courseData.files.length})</span>
              </div>
              {showFiles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {showFiles && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
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
          <div className="space-y-3">
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-between p-0 h-auto text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Prerequisites</span>
              </div>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {showDetails && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-in slide-in-from-top-2 duration-200">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {courseData.prerequisites}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {courseData.current_user_application ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Application submitted
            </div>
          ) : courseData.can_enroll.can_enroll ? (
            <Button
              onClick={() => onApply(course)}
              disabled={applying === course.id}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {applying === course.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Applying...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Apply Now
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-4 h-4" />
              {courseData.can_enroll.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 