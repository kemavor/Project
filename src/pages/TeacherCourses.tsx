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
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  useEffect(() => {
    fetchMyCourses();
    fetchApplications();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMyCourses();
      
      if (response.error) {
        setError(response.error);
      } else {
        const coursesData = response.data || [];
        setCourses(coursesData);
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
        setApplications(response.data || []);
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (user?.role !== 'teacher') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only teachers can access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  My Courses
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your courses, create new ones, and track student enrollment
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>
                      Add a new course to your teaching portfolio
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Course Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter course title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
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
                      <Label htmlFor="credits">Credits</Label>
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
                      <Label htmlFor="enrollment">Open for enrollment</Label>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Course</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Content */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Courses ({courses.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({courses.filter(c => c.is_enrollment_open).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({courses.filter(c => !c.is_enrollment_open).length})</TabsTrigger>
              <TabsTrigger value="applications">Applications ({applications.filter(a => a.status === 'pending').length})</TabsTrigger>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                      <p className="text-gray-600 mb-4">Create your first course to get started</p>
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
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {course.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={course.is_enrollment_open ? "default" : "secondary"}>
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
                        {/* Documents Section */}
                        {courseDocuments[course.id] && courseDocuments[course.id].length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Documents ({courseDocuments[course.id].length})
                            </h4>
                            <div className="space-y-2">
                              {courseDocuments[course.id].slice(0, 3).map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {doc.title || doc.original_filename}
                                      </p>
                                      <p className="text-xs text-gray-500">
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
                                <p className="text-xs text-gray-500 text-center">
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
    </Layout>
  );
};

export default TeacherCourses; 