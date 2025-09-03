import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Course, Application } from '../lib/api';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CourseCardSkeleton } from '../components/EnhancedSkeleton';
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Badge as DSBadge
} from '../components/ui/design-system';
import { 
  Plus, 
  BookOpen, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Users, 
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Clock,
  Upload,
  FileText,
  Download,
  EyeOff,
  Check,
  X,
  User,
  Mail,
  Star,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BackgroundPaths from '../components/BackgroundPaths';

interface CourseDocument {
  id: number;
  course_id: number;
  uploaded_by: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  s3_key: string;
  s3_bucket: string;
  s3_url?: string;
  cloudfront_url?: string;
  title?: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const TeacherCourses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
  const [courseDocuments, setCourseDocuments] = useState<Record<number, CourseDocument[]>>({});
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [deletingDocuments, setDeletingDocuments] = useState<Record<number, boolean>>({});
  const [processingApplication, setProcessingApplication] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    credits: 3,
    is_enrollment_open: true
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    credits: 3,
    is_enrollment_open: true
  });

  // Document upload form state
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    is_public: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teacherAnalytics, setTeacherAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      console.log('👨‍🏫 TeacherCourses: User loaded, fetching data for teacher:', user.username);
      fetchMyCourses();
      fetchApplications();
      fetchTeacherAnalytics();
    } else if (user) {
      console.warn('⚠️ TeacherCourses: User is not a teacher, role:', user.role);
    } else {
      console.log('⏳ TeacherCourses: Waiting for user authentication...');
    }
  }, [user]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      console.log('🎓 TeacherCourses: Starting to fetch my courses...');
      console.log('🔐 TeacherCourses: Current auth state:', {
        hasUser: !!user,
        userId: user?.id,
        userRole: user?.role,
        hasToken: !!localStorage.getItem('access_token')
      });
      
      const response = await apiClient.getMyCourses();
      
      console.log('📚 TeacherCourses: getMyCourses response:', {
        hasError: !!response.error,
        error: response.error,
        hasData: !!response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        dataType: typeof response.data
      });
      
      if (response.error) {
        console.error('❌ TeacherCourses: Error fetching courses:', response.error);
        setError(response.error);
      } else {
        const coursesData = response.data || [];
        console.log('✅ TeacherCourses: Setting courses:', coursesData);
        setCourses(coursesData as Course[]);
        // Fetch documents for each course
        const documents: Record<number, CourseDocument[]> = {};
        for (const course of coursesData) {
          try {
            const docResponse = await apiClient.getCourseDocuments(course.id);
            if (!docResponse.error) {
              documents[course.id] = docResponse.data || [];
            }
          } catch (err) {
            console.error(`Failed to fetch documents for course ${course.id}:`, err);
            documents[course.id] = [];
          }
        }
        setCourseDocuments(documents);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      console.log('📈 Fetching teacher analytics...');
      
      const response = await apiClient.getTeacherAnalytics();
      console.log('📊 Analytics response:', response);
      
      if (response.error) {
        console.error('❌ Analytics fetch error:', response.error);
      } else {
        console.log('✅ Analytics fetched successfully:', response.data);
        setTeacherAnalytics(response.data);
      }
    } catch (err) {
      console.error('❌ Analytics fetch exception:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true);
      console.log('🔄 Fetching course applications...');
      
      const response = await apiClient.getCourseApplications();
      console.log('📡 Applications response:', response);
      
      if (response.error) {
        console.error('❌ Applications fetch error:', response.error);
        toast.error(response.error);
      } else {
        console.log('✅ Applications fetched successfully:', response.data);
        setApplications(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('❌ Applications fetch exception:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await apiClient.createCourse(formData);
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Course created successfully!');
        setIsCreateDialogOpen(false);
        setFormData({ title: '', description: '', credits: 3, is_enrollment_open: true });
        fetchMyCourses();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create course');
    }
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse || !editFormData.title.trim() || !editFormData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await apiClient.updateCourse(selectedCourse.id, editFormData);
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Course updated successfully!');
        setIsEditDialogOpen(false);
        setSelectedCourse(null);
        fetchMyCourses();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      setDeletingCourseId(courseId);
      const response = await apiClient.deleteCourse(courseId);
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Course deleted successfully!');
        setIsDeleteDialogOpen(false);
        setSelectedCourse(null);
        fetchMyCourses();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setDeletingCourseId(null);
    }
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setEditFormData({
      title: course.title,
      description: course.description,
      credits: course.credits,
      is_enrollment_open: course.is_enrollment_open
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const openUploadDialog = (course: Course) => {
    setSelectedCourse(course);
    setUploadFormData({ title: '', description: '', is_public: true });
    setSelectedFile(null);
    setIsUploadDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title if empty
      if (!uploadFormData.title) {
        setUploadFormData(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse || !selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploadingDocument(true);
      
      // Debug logging
      console.log('🔍 Upload Debug Info:');
      console.log('Course ID:', selectedCourse.id);
      console.log('File:', selectedFile.name, selectedFile.size, 'bytes');
      console.log('Title:', uploadFormData.title || selectedFile.name);
      console.log('Description:', uploadFormData.description);
      console.log('Is Public:', uploadFormData.is_public);
      
      // Check authentication
      const token = localStorage.getItem('access_token');
      console.log('Auth Token exists:', !!token);
      
      const response = await apiClient.uploadCourseDocument(
        selectedCourse.id,
        selectedFile,
        uploadFormData.title || selectedFile.name,
        uploadFormData.description,
        uploadFormData.is_public
      );
      
      console.log('Upload Response:', response);
      
      if (response.error) {
        console.error('Upload Error:', response.error);
        toast.error(response.error);
      } else {
        console.log('Upload Success:', response.data);
        toast.success('Document uploaded successfully!');
        setIsUploadDialogOpen(false);
        setSelectedFile(null);
        setUploadFormData({ title: '', description: '', is_public: true });
        // Refresh documents for this course
        const docResponse = await apiClient.getCourseDocuments(selectedCourse.id);
        if (!docResponse.error) {
          setCourseDocuments(prev => ({
            ...prev,
            [selectedCourse.id]: docResponse.data || []
          }));
        }
      }
    } catch (err) {
      console.error('Upload Exception:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (documentId: number, courseId: number, documentTitle?: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${documentTitle || 'this document'}"? This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      // Set loading state
      setDeletingDocuments(prev => ({ ...prev, [documentId]: true }));
      
      const response = await apiClient.deleteDocument(documentId);
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Document deleted successfully!');
        // Remove from local state
        setCourseDocuments(prev => ({
          ...prev,
          [courseId]: prev[courseId]?.filter(doc => doc.id !== documentId) || []
        }));
      }
    } catch (err) {
      console.error('Delete document error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      // Clear loading state
      setDeletingDocuments(prev => ({ ...prev, [documentId]: false }));
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="badge-solid-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="badge-solid-success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="badge-solid-destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-300 text-gray-700">{status}</Badge>;
    }
  };

  if (user?.role !== 'teacher') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
                          <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <H2 className="text-gray-900 mb-2">Access Denied</H2>
                  <NormalText className="text-gray-600">Only teachers can access this page.</NormalText>
                </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6 space-y-6 relative overflow-hidden">
        <BackgroundPaths />
        <div className="relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-2xl">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <H1 className="text-black mb-2 font-bold text-4xl">
                    My Courses
                  </H1>
                  <LargeText className="text-black font-semibold text-lg">
                    Manage your courses, create new ones, and track student enrollment
                  </LargeText>
                </div>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <DSButton variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </DSButton>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-black font-bold text-xl">Create New Course</DialogTitle>
                    <DialogDescription className="text-black font-medium">
                      Add a new course to your teaching portfolio
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-black font-bold">Course Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter course title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-black font-bold">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter course description"
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="credits" className="text-black font-bold">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        min="1"
                        max="6"
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enrollment"
                        checked={formData.is_enrollment_open}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_enrollment_open: checked })}
                      />
                      <Label htmlFor="enrollment" className="text-black font-bold">Open for enrollment</Label>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="button" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                      >
                        Create Course
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Content */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Courses ({courses.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({courses.filter(c => c.is_enrollment_open).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({courses.filter(c => !c.is_enrollment_open).length})</TabsTrigger>
              <TabsTrigger value="applications">Applications ({applications.filter(a => a.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, index) => (
                    <CourseCardSkeleton key={index} />
                  ))}
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <p className="text-red-600 mb-4">{error}</p>
                      <Button onClick={fetchMyCourses}>Try Again</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : courses.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black mb-2 font-bold">No courses yet</h3>
                <p className="text-black mb-4 font-medium">Create your first course to get started</p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Course
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                                      <Card key={course.id} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-black mb-2 font-bold text-xl">
                            {course.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={course.is_enrollment_open ? "default" : "secondary"} className={course.is_enrollment_open ? "badge-solid-success" : "badge-solid-secondary"}>
                              {course.is_enrollment_open ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                            <Badge variant="outline" className="border-gray-300 text-gray-700">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              {course.credits} Credits
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-black text-sm mb-4 line-clamp-3 font-medium">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-black mb-4 font-medium">
                        <span>Created: {formatDate(course.created_at)}</span>
                      </div>
                        {/* Documents Section */}
                        {courseDocuments[course.id] && courseDocuments[course.id].length > 0 && (
                          <div className="mb-4">
                                                    <h4 className="text-sm font-medium text-black mb-2 font-bold">
                          Documents ({courseDocuments[course.id].length})
                        </h4>
                            <div className="space-y-2">
                              {courseDocuments[course.id].slice(0, 3).map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-gray-600" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-black truncate font-bold">
                                        {doc.title || doc.original_filename}
                                      </p>
                                      <p className="text-xs text-black font-medium">
                                        {formatFileSize(doc.file_size)} • {doc.file_type.toUpperCase()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {!doc.is_public && (
                                      <EyeOff className="w-3 h-3 text-gray-400" />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 p-1 h-6 w-6"
                                      onClick={() => handleDeleteDocument(doc.id, course.id, doc.title || doc.original_filename)}
                                      disabled={deletingDocuments[doc.id]}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {courseDocuments[course.id].length > 3 && (
                                <p className="text-xs text-black text-center font-medium">
                                  +{courseDocuments[course.id].length - 3} more documents
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(course)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUploadDialog(course)}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload Doc
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => openDeleteDialog(course)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <div className="space-y-4">
                {courses.filter(c => c.is_enrollment_open).map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {course.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
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
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span>Created: {formatDate(course.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(course)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openDeleteDialog(course)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4">
              <div className="space-y-4">
                {courses.filter(c => !c.is_enrollment_open).map((course) => (
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
                              Inactive
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
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span>Created: {formatDate(course.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(course)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openDeleteDialog(course)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              {applicationsLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, index) => (
                    <CourseCardSkeleton key={index} />
                  ))}
                </div>
              ) : applications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black mb-2 font-bold">No applications yet</h3>
                <p className="text-black mb-4 font-medium">Student applications will appear here when they apply for your courses</p>
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
                              <CardTitle className="text-lg font-semibold text-black font-bold text-xl">
                                {application.course?.title || `Course ${application.course_id}`}
                              </CardTitle>
                              {getStatusBadge(application.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-black font-medium">
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
                          <h4 className="text-sm font-medium text-black mb-2 font-bold">
                            Motivation Statement:
                          </h4>
                          <p className="text-black text-sm bg-gray-50 border border-gray-200 p-3 rounded-md font-medium">
                            {application.motivation_statement}
                          </p>
                        </div>
                                                    <div className="flex items-center justify-between text-sm text-black mb-4 font-medium">
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
                              className="btn-solid-success"
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
                              className="btn-solid-destructive"
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

            <TabsContent value="analytics" className="space-y-6">
              {analyticsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : teacherAnalytics ? (
                <div className="space-y-6">
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                                              <p className="text-sm text-black font-medium">Courses Taught</p>
                  <p className="text-2xl font-bold text-black">{teacherAnalytics.courses_taught || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                                              <p className="text-sm text-black font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-black">{teacherAnalytics.total_students || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <GraduationCap className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                                              <p className="text-sm text-black font-medium">Quizzes Generated</p>
                  <p className="text-2xl font-bold text-black">{teacherAnalytics.total_quizzes_generated || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Star className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                                              <p className="text-sm text-black font-medium">Avg Student Score</p>
                  <p className="text-2xl font-bold text-black">{teacherAnalytics.average_student_score || 0}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Course Performance */}
                  <Card className="bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-black font-bold text-xl">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                        Course Performance Analytics
                      </CardTitle>
                      <CardDescription className="text-black font-medium">
                        Detailed performance metrics for each of your courses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {teacherAnalytics.course_analytics && teacherAnalytics.course_analytics.length > 0 ? (
                        <div className="space-y-4">
                          {teacherAnalytics.course_analytics.map((course: any) => (
                            <div key={course.course_id} className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl hover:bg-blue-50/50 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-lg text-gray-900">{course.course_title}</h4>
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                  ID: {course.course_id}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="text-2xl font-bold text-blue-600">{course.students_enrolled}</div>
                                  <div className="text-xs text-gray-600 font-medium">Students Enrolled</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="text-2xl font-bold text-green-600">{course.total_quiz_sessions}</div>
                                  <div className="text-xs text-gray-600 font-medium">Quiz Sessions</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="text-2xl font-bold text-purple-600">{Math.round(course.average_score)}%</div>
                                  <div className="text-xs text-gray-600 font-medium">Avg Score</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="text-2xl font-bold text-orange-600">{Math.round(course.pass_rate)}%</div>
                                  <div className="text-xs text-gray-600 font-medium">Pass Rate</div>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex justify-between text-sm text-gray-600">
                                <span>Completion Rate: {Math.round(course.completion_rate)}%</span>
                                <span>Performance: {
                                  course.average_score >= 80 ? '🏆 Excellent' :
                                  course.average_score >= 70 ? '📈 Good' :
                                  course.average_score >= 60 ? '⚠️ Needs Attention' : '🔴 Concerns'
                                }</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">No course performance data available</p>
                          <p className="text-sm text-gray-500">Data will appear once students start taking quizzes</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Last Updated */}
                  {teacherAnalytics.last_updated && (
                    <div className="text-center text-sm text-gray-500">
                      Last updated: {new Date(teacherAnalytics.last_updated).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
                      <p className="text-gray-600 mb-4">Unable to load teacher analytics at this time</p>
                      <Button onClick={fetchTeacherAnalytics}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Edit Course Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Course</DialogTitle>
                <DialogDescription>
                  Update course information and settings
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditCourse} className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Course Title *</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    placeholder="Enter course title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description *</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Enter course description"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-credits">Credits</Label>
                  <Input
                    id="edit-credits"
                    type="number"
                    min="1"
                    max="6"
                    value={editFormData.credits}
                    onChange={(e) => setEditFormData({ ...editFormData, credits: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-enrollment"
                    checked={editFormData.is_enrollment_open}
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_enrollment_open: checked })}
                  />
                  <Label htmlFor="edit-enrollment">Open for enrollment</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Course</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Course Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Delete Course</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{selectedCourse?.title}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedCourse && handleDeleteCourse(selectedCourse.id)}
                  disabled={deletingCourseId === selectedCourse?.id}
                >
                  {deletingCourseId === selectedCourse?.id ? 'Deleting...' : 'Delete Course'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Upload Document Dialog */}
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Upload Document for {selectedCourse?.title}</DialogTitle>
                <DialogDescription>
                  Upload a document to share with students in this course.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <Label htmlFor="upload-title">Document Title (Optional)</Label>
                  <Input
                    id="upload-title"
                    value={uploadFormData.title}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                    placeholder="Enter document title"
                  />
                </div>
                <div>
                  <Label htmlFor="upload-description">Document Description (Optional)</Label>
                  <Textarea
                    id="upload-description"
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                    placeholder="Enter document description"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="upload-public"
                    checked={uploadFormData.is_public}
                    onCheckedChange={(checked) => setUploadFormData({ ...uploadFormData, is_public: checked })}
                  />
                  <Label htmlFor="upload-public">Make document public</Label>
                </div>
                <div>
                  <Label htmlFor="upload-file">Document File *</Label>
                  <Input
                    id="upload-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
                    onChange={handleFileSelect}
                    required
                    disabled={uploadingDocument}
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected file: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploadingDocument}>
                    {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherCourses; 