import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CourseCardSkeleton } from '../components/EnhancedSkeleton';
import { 
  BookOpen, 
  Download, 
  FileText, 
  Eye, 
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Application {
  id: number;
  student_id: number;
  course_id: number;
  student_year: number;
  gpa: number;
  motivation_statement: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CourseDocument {
  id: number;
  title: string;
  filename: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  is_public: boolean;
  created_at: string;
  download_url: string;
  view_url: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  credits: number;
  instructor_id: number;
  created_at: string;
  updated_at: string;
  is_enrollment_open: boolean;
}

interface AppliedCourse {
  course: Course;
  application: Application;
  documents: CourseDocument[];
}

const StudentAppliedCourses: React.FC = () => {
  const { user } = useAuth();
  const [appliedCourses, setAppliedCourses] = useState<AppliedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchAppliedCourses();
  }, []);

  const fetchAppliedCourses = async () => {
    try {
      setLoading(true);
      
      // Get student's applications
      const applicationsResponse = await apiClient.getMyApplications();
      
      if (applicationsResponse.error) {
        setError(applicationsResponse.error);
        return;
      }

      const applications: Application[] = (applicationsResponse.data as Application[]) || [];
      
      // Get course details and documents for each application
      const appliedCoursesData: AppliedCourse[] = [];
      
      for (const application of applications) {
        try {
          // Get course details
          const courseResponse = await apiClient.getCourse(application.course_id);
          if (courseResponse.error) {
            console.error(`Failed to get course ${application.course_id}:`, courseResponse.error);
            continue;
          }

          const course: Course = courseResponse.data as Course;
          
          // Get course documents
          const documentsResponse = await apiClient.getCourseDocumentsForStudents(application.course_id);
          const documents: CourseDocument[] = documentsResponse.error ? [] : (documentsResponse.data as CourseDocument[]) || [];
          
          appliedCoursesData.push({
            course,
            application,
            documents
          });
          
        } catch (err) {
          console.error(`Failed to fetch data for course ${application.course_id}:`, err);
        }
      }
      
      // Also get public documents from all courses
      try {
        const allCoursesResponse = await apiClient.getCourses();
        if (!allCoursesResponse.error && allCoursesResponse.data) {
          const allCourses = allCoursesResponse.data as Course[];
          
          for (const course of allCourses) {
            // Skip courses the student has already applied for
            const alreadyApplied = appliedCoursesData.some(ac => ac.course.id === course.id);
            if (alreadyApplied) continue;
            
            try {
              // Get public documents for this course
              const documentsResponse = await apiClient.getCourseDocumentsForStudents(course.id);
              if (!documentsResponse.error && documentsResponse.data) {
                const publicDocuments = (documentsResponse.data as CourseDocument[]).filter((doc: CourseDocument) => doc.is_public);
                
                if (publicDocuments.length > 0) {
                  // Create a dummy application for display purposes
                  const dummyApplication: Application = {
                    id: 0,
                    student_id: 0,
                    course_id: course.id,
                    student_year: 0,
                    gpa: 0,
                    motivation_statement: "",
                    status: "public_access",
                    created_at: "",
                    updated_at: ""
                  };
                  
                  appliedCoursesData.push({
                    course,
                    application: dummyApplication,
                    documents: publicDocuments
                  });
                }
              }
            } catch (err) {
              console.error(`Failed to fetch public documents for course ${course.id}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch public documents:', err);
      }
      
      setAppliedCourses(appliedCoursesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applied courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: CourseDocument) => {
    try {
      setDownloading(prev => ({ ...prev, [doc.id]: true }));
      
      // Get fresh download URL
      const response = await apiClient.getDocumentDownloadUrl(doc.id);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      const downloadData = response.data as any;
      if (downloadData && downloadData.download_url) {
        // Fetch the file content and create a blob for download
        const fileResponse = await fetch(downloadData.download_url);
        if (!fileResponse.ok) {
          throw new Error('Failed to fetch file');
        }
        const blob = await fileResponse.blob();
        const url = window.URL.createObjectURL(blob);
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadData.filename || 'document.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Clean up the blob URL
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback to opening in new tab
        window.open(downloadData.download_url, '_blank');
      }
      
      toast.success(`Downloading ${doc.title}`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download document');
    } finally {
      setDownloading(prev => ({ ...prev, [doc.id]: false }));
    }
  };

  const handleView = async (doc: CourseDocument) => {
    try {
      // Get fresh view URL
      const response = await apiClient.getDocumentDownloadUrl(doc.id);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      const downloadData = response.data as any;
      window.open(downloadData.download_url, '_blank');
      toast.success(`Opening ${doc.title}`);
    } catch (err) {
      console.error('View error:', err);
      toast.error('Failed to open document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "public_access":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      case "public_access":
        return <Eye className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (user?.role !== 'student') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only students can access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAppliedCourses}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const approvedCourses = appliedCourses.filter(ac => ac.application.status === 'approved');
  const pendingCourses = appliedCourses.filter(ac => ac.application.status === 'pending');
  const rejectedCourses = appliedCourses.filter(ac => ac.application.status === 'rejected');
  const publicAccessCourses = appliedCourses.filter(ac => ac.application.status === 'public_access');

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  My Applied Courses
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View your course applications and access course materials
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                All ({appliedCourses.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedCourses.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingCourses.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedCourses.length})
              </TabsTrigger>
              <TabsTrigger value="public">
                Public ({publicAccessCourses.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {appliedCourses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {appliedCourses.map(({ course, application, documents }) => (
                    <Card key={course.id} className="hover:shadow-lg transition-all duration-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {course.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="default">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {course.credits} Credits
                              </Badge>
                              <Badge className={getStatusColor(application.status)}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1 capitalize">{application.status}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                          {course.description}
                        </p>
                        
                        {/* Application Details */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Application Details:
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Year:</span>
                              <p className="font-medium">{application.student_year}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">GPA:</span>
                              <p className="font-medium">{application.gpa}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Applied:</span>
                              <p className="font-medium">{formatDate(application.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Documents Section */}
                        {documents.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Course Documents ({documents.length}):
                            </h4>
                            {documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {doc.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(doc.file_size)} • {doc.file_type.toUpperCase()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(doc)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    disabled={downloading[doc.id]}
                                    className="h-8 w-8 p-0"
                                  >
                                    {downloading[doc.id] ? (
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {documents.length === 0 && (
                          <div className="text-center py-4">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No documents available yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-gray-300 dark:border-slate-600">
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No applied courses</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      You haven't applied for any courses yet.
                    </p>
                    <Button onClick={() => window.location.href = '/courses'}>
                      Browse Courses
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-6">
              {approvedCourses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {approvedCourses.map(({ course, application, documents }) => (
                    <Card key={course.id} className="hover:shadow-lg transition-all duration-200 border-green-200 dark:border-green-800">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {course.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approved
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                          {course.description}
                        </p>
                        
                        {/* Documents Section */}
                        {documents.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Course Documents ({documents.length}):
                            </h4>
                            {documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {doc.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(doc.file_size)} • {doc.file_type.toUpperCase()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(doc)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    disabled={downloading[doc.id]}
                                    className="h-8 w-8 p-0"
                                  >
                                    {downloading[doc.id] ? (
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {documents.length === 0 && (
                          <div className="text-center py-4">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No documents available yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-gray-300 dark:border-slate-600">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No approved courses</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      You don't have any approved course applications yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-6">
              {pendingCourses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pendingCourses.map(({ course, application, documents }) => (
                    <Card key={course.id} className="hover:shadow-lg transition-all duration-200 border-yellow-200 dark:border-yellow-800">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {course.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                <Clock className="w-4 h-4 mr-1" />
                                Pending Review
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                          {course.description}
                        </p>
                        
                        {/* Application Details */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Application Details:
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Year:</span>
                              <p className="font-medium">{application.student_year}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">GPA:</span>
                              <p className="font-medium">{application.gpa}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Applied:</span>
                              <p className="font-medium">{formatDate(application.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center py-4">
                          <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Waiting for instructor review</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-gray-300 dark:border-slate-600">
                  <CardContent className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No pending applications</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      You don't have any pending course applications.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-6">
              {rejectedCourses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rejectedCourses.map(({ course, application, documents }) => (
                    <Card key={course.id} className="hover:shadow-lg transition-all duration-200 border-red-200 dark:border-red-800">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {course.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Rejected
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                          {course.description}
                        </p>
                        
                        {/* Application Details */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Application Details:
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Year:</span>
                              <p className="font-medium">{application.student_year}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">GPA:</span>
                              <p className="font-medium">{application.gpa}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Applied:</span>
                              <p className="font-medium">{formatDate(application.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Application was not approved</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-gray-300 dark:border-slate-600">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No rejected applications</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Great! You don't have any rejected applications.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="public" className="space-y-6">
              {publicAccessCourses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {publicAccessCourses.map(({ course, application, documents }) => (
                    <Card key={course.id} className="hover:shadow-lg transition-all duration-200 border-blue-200 dark:border-blue-800">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {course.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <Eye className="w-4 h-4 mr-1" />
                                Public Access
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                          {course.description}
                        </p>
                        
                        {/* Documents Section */}
                        {documents.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Public Documents ({documents.length}):
                            </h4>
                            {documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {doc.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(doc.file_size)} • {doc.file_type.toUpperCase()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(doc)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    disabled={downloading[doc.id]}
                                    className="h-8 w-8 p-0"
                                  >
                                    {downloading[doc.id] ? (
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {documents.length === 0 && (
                          <div className="text-center py-4">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No public documents available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-gray-300 dark:border-slate-600">
                  <CardContent className="text-center py-12">
                    <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No public documents</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      No public documents are currently available.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default StudentAppliedCourses; 