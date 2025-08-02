import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { MyEnrolledCourses } from '@/components/MyEnrolledCourses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Application, EnrolledCourse } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  BookOpen,
  PlayCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  Trophy,
  ArrowRight,
  GraduationCap,
  Calendar,
  Target,
  Users,
  Check,
  X,
  User,
  Mail,
  Star,
  AlertCircle,
  Eye,
  FileText,
  ClipboardList,
  RefreshCw
} from 'lucide-react';

const MyCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for enrolled courses (students)
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [enrolledCoursesLoading, setEnrolledCoursesLoading] = useState(false);

  // State for applications (teachers only)
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [processingApplication, setProcessingApplication] = useState<number | null>(null);

  // State for student applications
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [myApplicationsLoading, setMyApplicationsLoading] = useState(false);
  
  // State for tracking course enrollment changes
  const [previousEnrolledCount, setPreviousEnrolledCount] = useState(0);

  // Fetch enrolled courses for students
  const fetchEnrolledCourses = async () => {
    if (user?.role !== 'student') return;
    
    try {
      setEnrolledCoursesLoading(true);
      const response = await apiClient.getMyCourses();
      
      if (response.error) {
        toast.error(response.error);
      } else {
        const newEnrolledCourses = response.data || [];
        
        // Debug: Log the response structure
        console.log('Enrolled courses response:', response);
        console.log('Enrolled courses data:', newEnrolledCourses);
        
        // Handle different data structures - the API might return Course[] or EnrolledCourse[]
        let processedCourses: EnrolledCourse[] = [];
        
        if (newEnrolledCourses.length > 0) {
          // Check if the first item has a nested 'course' property (EnrolledCourse structure)
          const firstItem = newEnrolledCourses[0] as any;
          if (firstItem && firstItem.course) {
            // It's already in EnrolledCourse format
            processedCourses = newEnrolledCourses as EnrolledCourse[];
          } else {
            // It's in Course format, convert to EnrolledCourse format
            processedCourses = newEnrolledCourses.map((course: any) => ({
              id: course.id,
              course: course,
              enrolled_at: course.created_at || new Date().toISOString(),
              enrollment_status: 'enrolled',
              instructor: null
            })) as EnrolledCourse[];
          }
        }
        
        // Check if new courses were enrolled
        if (processedCourses.length > previousEnrolledCount && previousEnrolledCount > 0) {
          const newCourses = processedCourses.length - previousEnrolledCount;
          toast.success(`🎉 You've been approved for ${newCourses} new course${newCourses > 1 ? 's' : ''}!`);
        }
        
        setEnrolledCourses(processedCourses);
        setPreviousEnrolledCount(processedCourses.length);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch enrolled courses');
    } finally {
      setEnrolledCoursesLoading(false);
    }
  };

  // Fetch applications for teachers
  const fetchApplications = async () => {
    if (user?.role !== 'teacher') return;
    
    try {
      setApplicationsLoading(true);
      const response = await apiClient.getCourseApplications();
      
      if (response.error) {
        toast.error(response.error);
      } else {
        setApplications(response.data || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Fetch student's own applications
  const fetchMyApplications = async () => {
    if (user?.role !== 'student') return;
    
    try {
      setMyApplicationsLoading(true);
      const response = await apiClient.getMyApplications();
      
      if (response.error) {
        toast.error(response.error);
      } else {
        const newApplications = response.data || [];
        
        // Check for newly approved applications
        newApplications.forEach((app: Application) => {
          const existingApp = myApplications.find(existing => existing.id === app.id);
          if (existingApp && existingApp.status === 'pending' && app.status === 'approved') {
            const courseTitle = app.course?.title || `Course ${app.course_id}`;
            toast.success(`🎉 Your application for "${courseTitle}" has been approved!`);
          }
        });
        
        setMyApplications(newApplications);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setMyApplicationsLoading(false);
    }
  };

  // Handle application approval
  const handleApproveApplication = async (applicationId: number) => {
    try {
      setProcessingApplication(applicationId);
      const response = await apiClient.approveApplication(applicationId);
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Application approved successfully!');
        fetchApplications(); // Refresh applications
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve application');
    } finally {
      setProcessingApplication(null);
    }
  };

  // Handle application rejection
  const handleRejectApplication = async (applicationId: number) => {
    try {
      setProcessingApplication(applicationId);
      const response = await apiClient.rejectApplication(applicationId);
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Application rejected successfully!');
        fetchApplications(); // Refresh applications
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject application');
    } finally {
      setProcessingApplication(null);
    }
  };

  // Get status badge for applications
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fetch data on component mount and set up polling for real-time updates
  useEffect(() => {
    if (user?.role === 'teacher') {
      // Redirect teachers to the proper teacher courses page
      navigate('/teacher/courses');
      return;
    } else if (user?.role === 'student') {
      fetchEnrolledCourses();
      fetchMyApplications();
      
      // Set up polling to refresh data every 30 seconds for real-time updates
      const interval = setInterval(() => {
        fetchEnrolledCourses();
        fetchMyApplications();
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user?.role, navigate]);

  // If user is a teacher, show a loading state while redirecting
  if (user?.role === 'teacher') {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting to teacher courses...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Student view - return the student interface
  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">My Courses</h1>
                <p className="text-muted-foreground text-lg">
                  Continue your learning journey with your enrolled courses
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                fetchEnrolledCourses();
                fetchMyApplications();
                toast.success('Refreshed course data');
              }}
              disabled={enrolledCoursesLoading || myApplicationsLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Course Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">70%</div>
              <Progress value={70} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">
                25 of 37 lectures completed across all courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Study Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">24h</div>
              <p className="text-sm text-muted-foreground">
                This week • 3.4h average per day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{enrolledCourses.length}</div>
              <p className="text-sm text-muted-foreground">
                Currently enrolled courses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Enrolled Courses
            </CardTitle>
            <CardDescription>Your current course enrollments and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrolledCoursesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading enrolled courses...</p>
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No enrolled courses</h3>
                <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet</p>
                <Button onClick={() => navigate('/courses')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {enrolledCourses.map((enrolledCourse) => {
                  // Skip courses that don't have proper data
                  if (!enrolledCourse.course) {
                    console.warn('Enrolled course missing course data:', enrolledCourse);
                    return null;
                  }
                  
                  return (
                    <div key={enrolledCourse.course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {enrolledCourse.course.title || 'Untitled Course'}
                          </h3>
                          <p className="text-gray-600 mb-3">{enrolledCourse.course.description || 'No description available'}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{enrolledCourse.instructor?.first_name} {enrolledCourse.instructor?.last_name || 'Unknown Instructor'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Enrolled {formatDate(enrolledCourse.enrolled_at || enrolledCourse.enrollment_date || new Date().toISOString())}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/courses/${enrolledCourse.course.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Course
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/courses/${enrolledCourse.course.id}/documents`)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Documents
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              My Applications
            </CardTitle>
            <CardDescription>Track your course applications and their status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myApplicationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications</h3>
                <p className="text-gray-600 mb-4">You haven't applied to any courses yet</p>
                <Button onClick={() => navigate('/courses')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {application.course?.title || `Course ${application.course_id}`}
                          </h4>
                          {getStatusBadge(application.status)}
                        </div>
                        <p className="text-gray-600 mb-3">{application.motivation_statement}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Applied {formatDate(application.created_at)}</span>
                          </div>
                          {application.updated_at !== application.created_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Updated {formatDate(application.updated_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyCourses; 