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
  Calendar,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

interface CourseWithDocuments {
  id: number;
  title: string;
  description: string;
  credits: number;
  instructor_id: number;
  created_at: string;
  updated_at: string;
  is_enrollment_open: boolean;
  documents: CourseDocument[];
}

const StudentCourseDocuments: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchCoursesWithDocuments();
  }, []);

  const fetchCoursesWithDocuments = async () => {
    try {
      setLoading(true);
      
      // Get all courses
      const coursesResponse = await apiClient.getCourses();
      
      if (coursesResponse.error) {
        setError(coursesResponse.error);
        return;
      }

      const coursesData = (coursesResponse.data as any[]) || [];
      
      // Fetch documents for each course
      const coursesWithDocs: CourseWithDocuments[] = [];
      
      for (const course of coursesData) {
        try {
          const docsResponse = await apiClient.getCourseDocumentsForStudents(course.id);
          if (!docsResponse.error) {
            coursesWithDocs.push({
              ...course,
              documents: (docsResponse.data as CourseDocument[]) || []
            });
          } else {
            coursesWithDocs.push({
              ...course,
              documents: []
            });
          }
        } catch (err) {
          console.error(`Failed to fetch documents for course ${course.id}:`, err);
          coursesWithDocs.push({
            ...course,
            documents: []
          });
        }
      }
      
      setCourses(coursesWithDocs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
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
            <Button onClick={fetchCoursesWithDocuments}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const coursesWithDocuments = courses.filter(course => course.documents.length > 0);
  const coursesWithoutDocuments = courses.filter(course => course.documents.length === 0);

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
                  Course Documents
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Access and download course materials and resources
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <Tabs defaultValue="with-documents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="with-documents">
                Available Documents ({coursesWithDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="no-documents">
                Other Courses ({coursesWithoutDocuments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="with-documents" className="space-y-6">
              {coursesWithDocuments.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {coursesWithDocuments.map((course) => (
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
                              <Badge variant="outline">
                                <FileText className="w-3 h-3 mr-1" />
                                {course.documents.length} Documents
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                          {course.description}
                        </p>
                        
                        {/* Documents List */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Available Documents:
                          </h4>
                          {course.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {doc.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(doc.file_size)} • {doc.file_type.toUpperCase()} • {formatDate(doc.created_at)}
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-gray-300 dark:border-slate-600">
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No documents available</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Course documents will appear here once they are uploaded by instructors.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="no-documents" className="space-y-6">
              {coursesWithoutDocuments.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {coursesWithoutDocuments.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-all duration-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {course.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                No Documents
                              </Badge>
                              <Badge variant="outline">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {course.credits} Credits
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                          {course.description}
                        </p>
                        <div className="text-center py-4">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No documents uploaded yet</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-gray-300 dark:border-slate-600">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All courses have documents!</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Great! All available courses have documents uploaded.
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

export default StudentCourseDocuments; 