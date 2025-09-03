import React from "react";
import { useMyCourses } from "../hooks/useMyCourses";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BookOpen, PlayCircle, Eye, FileText, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardMyCourses: React.FC = () => {
  const { courses, loading, error } = useMyCourses();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
        <p className="text-center text-muted-foreground">Loading enrolled courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-800">No enrolled courses</h3>
          <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet</p>
          <Button onClick={() => navigate('/courses')}>
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div key={course.id} className="asklepios-card p-4 hover:scale-105 transition-all duration-200 bg-white text-gray-900">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {course.title || course.name || 'Untitled Course'}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {course.description || 'No description available'}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Instructor</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Enrolled {formatDate(course.created_at || new Date().toISOString())}</span>
                </div>
                {course.credits && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{course.credits} Credits</span>
                  </div>
                )}
              </div>
            </div>
            <Badge className="asklepios-badge-success">
              Enrolled
            </Badge>
          </div>
          
          {/* Mock progress - in real implementation this would come from user progress tracking */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm text-gray-700 font-medium">
              <span>Progress</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold text-xs">65% Complete</span>
            </div>
            <Progress value={65} className="h-3 bg-gray-200" />
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Course
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              onClick={() => navigate(`/courses/${course.id}/documents`)}
            >
              <FileText className="h-4 w-4 mr-1" />
              Documents
            </Button>
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <PlayCircle className="h-4 w-4 mr-1" />
              Continue
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}; 