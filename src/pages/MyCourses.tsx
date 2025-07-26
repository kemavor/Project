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
  AlertCircle
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

  // Fetch enrolled courses for students
  const fetchEnrolledCourses = async () => {
    if (user?.role !== 'student') return;
    
    try {
      setEnrolledCoursesLoading(true);
      const response = await apiClient.getMyCourses();
      
      if (response.error) {
        toast.error(response.error);
      } else {
        setEnrolledCourses(response.data || []);
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
        setMyApplications(response.data || []);
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

  // Fetch data on component mount
  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchApplications();
    } else if (user?.role === 'student') {
      fetchEnrolledCourses();
      fetchMyApplications();
    }
  }, [user?.role]);

  if (user?.role === 'teacher') {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">My Teaching Courses</h1>
                <p className="text-muted-foreground text-lg">
                  Manage your courses and review student applications
                </p>
              </div>
            </div>
          </div>

          {/* Tabs for Teachers */}
          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="applications">
                Applications ({applications.filter(a => a.status === 'pending').length})
              </TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Course Management</h2>
                <p className="text-muted-foreground mb-6">Manage your teaching courses and content</p>
                <Button onClick={() => navigate('/teacher/courses')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage My Teaching Courses
                </Button>
              </div>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-4">
              {applicationsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
                      <p className="text-gray-600 mb-4">Student applications will appear here when they apply for your courses</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <Card key={application.id} className="hover:shadow-lg transition-all duration-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                {application.course?.title || `Course ${application.course_id}`}
                              </CardTitle>
                              {getStatusBadge(application.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{application.student?.first_name} {application.student?.last_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span>{application.student?.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <GraduationCap className="w-4 h-4" />
                                <span>Year {application.student_year}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                <span>GPA: {application.gpa}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Motivation Statement:
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                            {application.motivation_statement}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <span>Applied: {formatDate(application.created_at)}</span>
                          {application.updated_at !== application.created_at && (
                            <span>Updated: {formatDate(application.updated_at)}</span>
                          )}
                        </div>
                        {application.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveApplication(application.id)}
                              disabled={processingApplication === application.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingApplication === application.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                              ) : (
                                <Check className="w-4 h-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectApplication(application.id)}
                              disabled={processingApplication === application.id}
                            >
                              {processingApplication === application.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                              ) : (
                                <X className="w-4 h-4 mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
              <div className="text-3xl font-bold mb-2">3</div>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No enrolled courses yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Apply for courses to get started with your learning journey
                </p>
                <Button onClick={() => navigate('/courses')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Available Courses
                </Button>
              </div>
            ) : (
              enrolledCourses.map((course) => (
                <div key={course.id} className="asklepios-card p-4 hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{course.title}</h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Enrolled
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Instructor: {course.instructor?.first_name} {course.instructor?.last_name}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Course ID: {course.id}</span>
                      <span>Credits: {course.credits || 3}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Enrolled: {formatDate(course.enrolled_at)}</span>
                      <span>Status: {course.enrollment_status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {course.description || 'No description available'}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/courses/${course.id}`)}>
                      <PlayCircle className="h-4 w-4 mr-1" />
                      View Course
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/courses/${course.id}/documents`)}>
                      <BookOpen className="h-4 w-4 mr-1" />
                      Materials
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Applications - For Students */}
        {myApplications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Course Applications
              </CardTitle>
              <CardDescription>Track the status of your course applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myApplicationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading applications...</p>
                </div>
              ) : (
                myApplications.map((application) => (
                  <div key={application.id} className="asklepios-card p-4 hover:scale-105 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{application.course?.title || `Course ${application.course_id}`}</h3>
                      {getStatusBadge(application.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Applied: {formatDate(application.created_at)}</span>
                        {application.updated_at !== application.created_at && (
                          <span>Updated: {formatDate(application.updated_at)}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p><strong>GPA:</strong> {application.gpa}</p>
                        <p><strong>Year:</strong> {application.student_year}</p>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-2">Motivation Statement:</h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          {application.motivation_statement}
                        </p>
                      </div>
                      {application.status === 'approved' && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Congratulations! You've been enrolled in this course. You can now access all course materials.
                          </p>
                        </div>
                      )}
                      {application.status === 'rejected' && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            Your application was not approved. You can apply for other courses or contact the instructor for more information.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activities and Deadlines */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activities
              </CardTitle>
              <CardDescription>Your latest learning activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* This section will need to be populated with actual recent activities */}
              <p className="text-muted-foreground text-center">No recent activities recorded.</p>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Stay on top of your assignments and quizzes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* This section will need to be populated with actual upcoming deadlines */}
              <p className="text-muted-foreground text-center">No upcoming deadlines.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MyCourses; 