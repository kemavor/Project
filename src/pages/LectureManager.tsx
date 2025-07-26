import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lecture } from '../lib/api';
import { getLectures, deleteLecture } from '../lib/api';
import { wsService } from '../lib/websocket';
import { formatDateTime, handleApiError } from '../lib/utils';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CreateLectureModal } from '../components/CreateLectureModal';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, User, Eye, Plus, AlertCircle, BookOpen, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../hooks/useCourses';
import { Layout } from '../components/Layout';

const LectureManager: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { courses, loading: isLoadingCourses, error: errorCourses } = useCourses();
  const [lastCreatedLectureId, setLastCreatedLectureId] = useState<string | null>(null);

  // Check if user can create lectures
  const canCreateLectures = hasRole('teacher') || hasRole('admin') || hasRole('super_admin') || hasRole('dept_head');

  // Load lectures on component mount
  useEffect(() => {
    loadLectures();
    
    // Set up WebSocket listeners for real-time updates
    wsService.on('lecture:status_change', (data) => {
      setLectures(prev => prev.map(lecture => 
        String(lecture.id) === String(data.lectureId) 
          ? { ...lecture, status: data.status }
          : lecture
      ));
    });

    return () => {
      // Cleanup WebSocket listeners
      wsService.off('lecture:status_change', () => {});
    };
  }, []);

  const loadLectures = async () => {
    try {
      setLoading(true);
      const response = await getLectures();
      if (response.data && Array.isArray(response.data)) {
        setLectures(response.data as Lecture[]);
      }
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const joinLecture = (lectureId: number) => {
    if (!lectureId) {
      toast.error("Invalid lecture ID. Cannot join this lecture.");
      return;
    }
    // Navigate to the new livestream system
    navigate(`/livestream/create`);
  };

  const handleDeleteLecture = async (lectureId: number) => {
    if (!lectureId) {
      toast.error('Invalid lecture ID. Cannot delete.');
      return;
    }
    try {
      await deleteLecture(lectureId);
      toast.success('Lecture deleted successfully!');
      setLectures(prev => prev.filter(l => l.id !== lectureId));
    } catch (error) {
      toast.error(handleApiError(error));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="destructive" className="animate-pulse">Live</Badge>;
      case 'ended':
        return <Badge variant="secondary">Ended</Badge>;
      case 'scheduled':
      default:
        return <Badge variant="default">Scheduled</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Helper to get course name by id
  const getCourseName = (courseId: number | string) => {
    const course = (courses || []).find((c: any) => String(c.id) === String(courseId));
    return course ? (course.course_name || course.title) : 'Unknown Course';
  };

  // Pass a callback to CreateLectureModal to set last created lecture
  const handleCreateSuccess = (newLecture?: any) => {
    loadLectures();
    if (newLecture && newLecture.id) {
      setLastCreatedLectureId(newLecture.id);
      setTimeout(() => setLastCreatedLectureId(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading lectures...</div>
      </div>
    );
  }

  if (isLoadingCourses) return <div>Loading...</div>;
  if (errorCourses) return <div>Error loading courses</div>;

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lectures</h1>
            <p className="text-gray-500 mt-2">
              {canCreateLectures 
                ? "Browse, join, and manage lectures" 
                : "Browse and join available lectures"
              }
            </p>
            {user && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {typeof user.role === 'object' ? user.role.name : user.role}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => loadLectures()}
              variant="outline"
            >
              Refresh
            </Button>
            {canCreateLectures && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Lecture
              </Button>
            )}
          </div>
        </div>

        {/* Role-based information banner */}
        {!canCreateLectures && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    Student Access
                  </p>
                  <p className="text-sm text-blue-600">
                    You can view, join, and participate in lectures. Only teachers and administrators can create new lectures.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {lectures.map(lecture => {
            if (!lecture.id) {
              console.warn('Lecture missing ID:', lecture);
            }
            return (
              <Card key={lecture.id || Math.random()} className={`hover:shadow-lg transition-shadow ${Number(lastCreatedLectureId) === lecture.id ? 'ring-2 ring-blue-400' : ''}`}> 
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-2">{lecture.title || 'Untitled Lecture'}</CardTitle>
                    {getStatusBadge(lecture.status || 'scheduled')}
                  </div>
                  <CardDescription className="line-clamp-3">
                    {lecture.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{lecture.instructor || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">Lecturer: {lecture.instructor || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{lecture.date ? new Date(lecture.date).toLocaleDateString() : lecture.scheduled_at ? new Date(lecture.scheduled_at).toLocaleDateString() : 'No date set'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{lecture.duration ? `${lecture.duration} minutes` : 'N/A'}</span>
                      </div>
                      {lecture.is_live && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <Eye className="h-4 w-4" />
                          <span>{lecture.viewer_count} viewers</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => joinLecture(lecture.id)}
                        className="flex-1"
                        variant={lecture.is_live ? "destructive" : "default"}
                        disabled={!lecture.id}
                      >
                        {lecture.is_live ? 'Join Live' : 'View Details'}
                      </Button>
                      {canCreateLectures && lecture.id && (
                        <Button
                          onClick={() => handleDeleteLecture(lecture.id)}
                          variant="outline"
                          className="flex items-center gap-1"
                          title="Delete Lecture"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {lectures.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No lectures found</p>
              {canCreateLectures && (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4"
                >
                  Create Your First Lecture
                </Button>
              )}
              {!canCreateLectures && (
                <p className="text-sm text-gray-400 mt-2">
                  Check back later for new lectures from your teachers.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {canCreateLectures && (
          <CreateLectureModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </Layout>
  );
};

export default LectureManager;