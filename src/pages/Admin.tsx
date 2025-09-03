import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import BackgroundPaths from '@/components/BackgroundPaths';
import { LoaderOne } from '@/components/ui/loader';
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Badge as DSBadge
} from '@/components/ui/design-system';
import {
  Users,
  BookOpen,
  Video,
  Settings,
  Trash2,
  Edit,
  Eye,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Shield,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Globe,
  Database,
  Server,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalLivestreams: number;
  activeUsers: number;
  pendingApplications: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
  created_at: string;
  is_enrollment_open: boolean;
  credits: number;
  instructor?: {
    first_name: string;
    last_name: string;
  };
}

interface Livestream {
  id: number;
  title: string;
  status: string;
  instructor_id: number;
  created_at: string;
  viewer_count: number;
  instructor?: {
    first_name: string;
    last_name: string;
  };
}

const Admin: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalLivestreams: 0,
    activeUsers: 0,
    pendingApplications: 0,
    systemHealth: 'healthy'
  });
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [livestreams, setLivestreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Check if user has admin privileges
  if (!hasRole('admin') && !hasRole('super_admin')) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the admin panel.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Fetch admin data
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersResponse = await apiClient.getAdminUsers();
      if (usersResponse.data && Array.isArray(usersResponse.data)) {
        setUsers(usersResponse.data);
      } else {
        setUsers([]);
      }

      // Fetch courses
      const coursesResponse = await apiClient.getAdminCourses();
      if (coursesResponse.data && Array.isArray(coursesResponse.data)) {
        setCourses(coursesResponse.data);
      } else {
        setCourses([]);
      }

      // Fetch livestreams
      const livestreamsResponse = await apiClient.getAdminLivestreams();
      if (livestreamsResponse.data && Array.isArray(livestreamsResponse.data)) {
        setLivestreams(livestreamsResponse.data);
      } else {
        setLivestreams([]);
      }

      // Fetch stats
      const statsResponse = await apiClient.getAdminStats();
      if (statsResponse.data && typeof statsResponse.data === 'object') {
        const data = statsResponse.data as any;
        setStats({
          totalUsers: data.total_users || 0,
          totalCourses: data.total_courses || 0,
          totalLivestreams: data.total_livestreams || 0,
          activeUsers: data.active_users || 0,
          pendingApplications: data.pending_applications || 0,
          systemHealth: data.system_health || 'healthy'
        });
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filter and sort functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof User];
    const bValue = b[sortBy as keyof User];
    if (sortOrder === 'asc') {
      return (aValue || '') > (bValue || '') ? 1 : -1;
    } else {
      return (aValue || '') < (bValue || '') ? 1 : -1;
    }
  });

  // Admin actions
  const deleteUser = async (userId: number) => {
    // Prevent admin from deleting themselves
    if (userId === user?.id) {
      toast.error('You cannot delete your own account from the admin panel. Use the profile page instead.');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.deleteAdminUser(userId);
      if (response.error) {
        toast.error(typeof response.error === 'string' ? response.error : 'Failed to delete user');
        return;
      }
      toast.success('User deleted successfully');
      fetchAdminData();
    } catch (error: any) {
      const possibleMsg = error?.message || error?.response?.data?.detail;
      toast.error(possibleMsg || 'Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await apiClient.updateAdminUser(userId, {
        is_active: !isActive
      });
      toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`);
      fetchAdminData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update user status';
      toast.error(errorMessage);
      console.error('Error updating user status:', error);
    }
  };

  const deleteCourse = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteAdminCourse(courseId);
      toast.success('Course deleted successfully');
      fetchAdminData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete course';
      toast.error(errorMessage);
      console.error('Error deleting course:', error);
    }
  };

  const deleteLivestream = async (streamId: number) => {
    if (!confirm('Are you sure you want to delete this livestream? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteAdminLivestream(streamId);
      toast.success('Livestream deleted successfully');
      fetchAdminData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete livestream';
      toast.error(errorMessage);
      console.error('Error deleting livestream:', error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6 space-y-6 relative overflow-hidden">
        <BackgroundPaths />
        <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-700">Manage users, courses, and platform settings</p>
          </div>
          <DSButton variant="primary" onClick={fetchAdminData} disabled={loading}>
            {loading ? (
              <LoaderOne size="sm" className="mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </DSButton>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white text-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
              <p className="text-xs text-gray-600">
                {stats.activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white text-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCourses}</div>
              <p className="text-xs text-gray-600">
                Platform courses
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white text-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Livestreams</CardTitle>
              <Video className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalLivestreams}</div>
              <p className="text-xs text-gray-600">
                Total streams
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white text-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">System Health</CardTitle>
              <Server className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  stats.systemHealth === 'healthy' ? 'bg-green-600' :
                  stats.systemHealth === 'warning' ? 'bg-orange-600' : 'bg-red-600'
                }`} />
                <span className="text-sm font-medium capitalize text-gray-900">{stats.systemHealth}</span>
              </div>
              <p className="text-xs text-gray-600">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="w-full text-gray-900">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="livestreams">Livestreams</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white text-gray-900">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <div className="space-y-4">
                  {filteredUsers.map((userItem) => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg bg-white text-gray-900">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{userItem.first_name} {userItem.last_name}</h3>
                          <p className="text-sm text-gray-700">{userItem.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={userItem.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                              {userItem.role}
                            </Badge>
                            <Badge variant={userItem.is_active ? 'default' : 'secondary'}>
                              {userItem.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(userItem.id, userItem.is_active)}
                          className="btn-solid-secondary"
                        >
                          {userItem.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteUser(userItem.id)}
                          disabled={userItem.id === user?.id}
                          title={userItem.id === user?.id ? "Cannot delete your own account" : ""}
                          className="btn-solid-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {userItem.id === user?.id && (
                          <Badge variant="outline" className="text-xs">
                            Current User
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Management</CardTitle>
                <CardDescription>Manage all platform courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-700">{course.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{course.credits} credits</Badge>
                            <Badge variant={course.is_enrollment_open ? 'default' : 'secondary'}>
                              {course.is_enrollment_open ? 'Open' : 'Closed'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

                     {/* Livestreams Tab */}
           <TabsContent value="livestreams" className="space-y-6">
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle>Livestream Management</CardTitle>
                     <CardDescription>Manage all platform livestreams</CardDescription>
                   </div>
                   <Button
                     variant="destructive"
                     onClick={async () => {
                       if (!confirm('Are you sure you want to clear all ended livestreams? This action cannot be undone.')) {
                         return;
                       }
                       try {
                         const response = await apiClient.clearEndedLivestreams();
                         toast.success((response.data as any)?.message || 'Ended livestreams cleared successfully');
                         fetchAdminData();
                       } catch (error: any) {
                         const errorMessage = error.response?.data?.detail || 'Failed to clear ended livestreams';
                         toast.error(errorMessage);
                         console.error('Error clearing ended livestreams:', error);
                       }
                     }}
                   >
                     <Trash2 className="h-4 w-4 mr-2" />
                     Clear Ended Streams
                   </Button>
                 </div>
               </CardHeader>
               <CardContent>
                <div className="space-y-4">
                  {livestreams.map((stream) => (
                    <div key={stream.id} className="flex items-center justify-between p-4 border rounded-lg bg-white text-gray-900">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center">
                          <Video className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{stream.title}</h3>
                          <p className="text-sm text-gray-700">
                            {stream.instructor?.first_name} {stream.instructor?.last_name}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={
                              stream.status === 'live' ? 'destructive' :
                              stream.status === 'ended' ? 'secondary' : 'outline'
                            }>
                              {stream.status}
                            </Badge>
                             <span className="text-sm text-gray-700">
                              {stream.viewer_count} viewers
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteLivestream(stream.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">System Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Maintenance Mode</label>
                        <Select defaultValue="off">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="off">Off</SelectItem>
                            <SelectItem value="on">On</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Registration</label>
                        <Select defaultValue="enabled">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Security Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Session Timeout</label>
                        <Select defaultValue="24h">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1h">1 Hour</SelectItem>
                            <SelectItem value="24h">24 Hours</SelectItem>
                            <SelectItem value="7d">7 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Two-Factor Auth</label>
                        <Select defaultValue="optional">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disabled">Disabled</SelectItem>
                            <SelectItem value="optional">Optional</SelectItem>
                            <SelectItem value="required">Required</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Admin; 