import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Badge as DSBadge,
  Card as DSCard
} from '@/components/ui/design-system';
import {
  BookOpen,
  PlayCircle,
  Download,
  Calendar,
  User,
  Star,
  ArrowLeft,
  FileText,
  Video,
  Clock,
  TrendingUp
} from 'lucide-react';

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
  instructor?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  credits: number;
  created_at: string;
  updated_at: string;
  enrolled_at?: string;
  enrollment_status?: string;
}

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchCourseDetail = async () => {
      if (!courseId) return;
      
      // Check if user is authenticated
      if (!user || !isAuthenticated) {
        if (isMounted) {
          setError('Please log in to view course details');
          toast.error('Please log in to view course details');
          setLoading(false);
        }
        return;
      }
      
      try {
        if (isMounted) {
          setLoading(true);
        }
        const response = await apiClient.getCourse(parseInt(courseId));
        
        if (!isMounted) return;
        
        if (response.error) {
          setError(response.error);
          toast.error(response.error);
        } else {
          setCourse(response.data as CourseDetail || null);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCourseDetail();
    
    return () => {
      isMounted = false;
    };
  }, [courseId, user, isAuthenticated]);

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {error?.includes('log in') ? 'Authentication Required' : 'Course not found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {error || 'The requested course could not be found.'}
            </p>
            {error?.includes('log in') ? (
              <Button onClick={() => navigate('/login')}>
                <User className="h-4 w-4 mr-2" />
                Log In
              </Button>
            ) : (
              <Button onClick={() => navigate('/my-courses')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Courses
              </Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/my-courses')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="p-3 bg-blue-500 rounded-2xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <H1 className="text-gray-900 mb-1">{course.title}</H1>
              <LargeText className="text-gray-600">
                Course details and learning materials
              </LargeText>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Course Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Course Overview</CardTitle>
                <CardDescription className="text-gray-600">Essential information about this course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-gray-900">Description</h3>
                  <p className="text-gray-700">{course.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Enrolled: {new Date(course.enrolled_at || '').toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Credits: {course.credits}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {course.enrollment_status || 'Not Enrolled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Quick Actions</CardTitle>
                <CardDescription className="text-gray-600">Access course materials and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => navigate(`/courses/${course.id}/documents`)}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Materials
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/courses')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse More Courses
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <User className="h-5 w-5 text-gray-700" />
                  Instructor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {course.instructor?.first_name && course.instructor?.last_name 
                      ? `${course.instructor.first_name} ${course.instructor.last_name}`
                      : `Instructor ID: ${course.instructor_id}`
                    }
                  </h3>
                  <p className="text-sm text-gray-600">
                    {course.instructor?.email || 'Email not available'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <TrendingUp className="h-5 w-5 text-gray-700" />
                  Course Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2 text-gray-700 font-medium">
                    <span>Overall Progress</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-xs">0% Complete</span>
                  </div>
                  <Progress value={0} className="h-3 bg-gray-200" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">0</div>
                    <div className="text-gray-600">Lectures</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">0</div>
                    <div className="text-gray-600">Documents</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail; 