import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { 
  Bell, 
  BookOpen, 
  FileText, 
  Video, 
  Users, 
  Trophy, 
  Settings, 
  Clock,
  Mail,
  Smartphone,
  Monitor,
  Save,
  RotateCcw
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface NotificationPreferences {
  id: number;
  user_id: number;
  course_notifications: boolean;
  application_notifications: boolean;
  stream_notifications: boolean;
  document_notifications: boolean;
  system_notifications: boolean;
  achievement_notifications: boolean;
  low_priority: boolean;
  normal_priority: boolean;
  high_priority: boolean;
  urgent_priority: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  notification_frequency: string;
  enrolled_courses_only: boolean;
  instructor_courses_only: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

const NotificationPreferences: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getNotificationPreferences();
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await apiClient.updateNotificationPreferences(preferences);
      if (response.data) {
        setPreferences(response.data);
        setHasChanges(false);
        toast.success('Notification preferences saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await apiClient.resetNotificationPreferences();
      await fetchPreferences();
      setHasChanges(false);
      toast.success('Notification preferences reset to defaults!');
    } catch (error) {
      console.error('Failed to reset notification preferences:', error);
      toast.error('Failed to reset notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading notification preferences...</span>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load notification preferences</p>
        <Button onClick={fetchPreferences}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Preferences</h1>
          <p className="text-muted-foreground">
            Customize how and when you receive notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Category Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Categories
          </CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="font-medium">Course Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Updates about your enrolled courses
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.course_notifications}
                onCheckedChange={(checked) => updatePreference('course_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="font-medium">Application Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Status updates for course applications
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.application_notifications}
                onCheckedChange={(checked) => updatePreference('application_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-purple-500" />
                <div>
                  <Label className="font-medium">Stream Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Live stream schedules and updates
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.stream_notifications}
                onCheckedChange={(checked) => updatePreference('stream_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-500" />
                <div>
                  <Label className="font-medium">Document Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    New course materials and documents
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.document_notifications}
                onCheckedChange={(checked) => updatePreference('document_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="font-medium">System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Platform updates and maintenance
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.system_notifications}
                onCheckedChange={(checked) => updatePreference('system_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <Label className="font-medium">Achievement Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Milestones and accomplishments
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.achievement_notifications}
                onCheckedChange={(checked) => updatePreference('achievement_notifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Priority Levels
          </CardTitle>
          <CardDescription>
            Choose which priority levels you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Low Priority</Label>
                <p className="text-sm text-muted-foreground">
                  General updates and reminders
                </p>
              </div>
              <Switch
                checked={preferences.low_priority}
                onCheckedChange={(checked) => updatePreference('low_priority', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Normal Priority</Label>
                <p className="text-sm text-muted-foreground">
                  Standard notifications
                </p>
              </div>
              <Switch
                checked={preferences.normal_priority}
                onCheckedChange={(checked) => updatePreference('normal_priority', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">High Priority</Label>
                <p className="text-sm text-muted-foreground">
                  Important updates and deadlines
                </p>
              </div>
              <Switch
                checked={preferences.high_priority}
                onCheckedChange={(checked) => updatePreference('high_priority', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Urgent Priority</Label>
                <p className="text-sm text-muted-foreground">
                  Critical updates and emergencies
                </p>
              </div>
              <Switch
                checked={preferences.urgent_priority}
                onCheckedChange={(checked) => updatePreference('urgent_priority', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Delivery Methods
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="font-medium">In-App</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications within the app
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.in_app_notifications}
                onCheckedChange={(checked) => updatePreference('in_app_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Email notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-purple-500" />
                <div>
                  <Label className="font-medium">Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Push notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
          <CardDescription>
            Fine-tune your notification experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Notification Frequency</Label>
              <Select
                value={preferences.notification_frequency}
                onValueChange={(value) => updatePreference('notification_frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Course Filtering</Label>
              <div className="space-y-2">
                {user?.role === 'student' && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={preferences.enrolled_courses_only}
                      onCheckedChange={(checked) => updatePreference('enrolled_courses_only', checked)}
                    />
                    <Label className="text-sm">Enrolled courses only</Label>
                  </div>
                )}
                {user?.role === 'teacher' && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={preferences.instructor_courses_only}
                      onCheckedChange={(checked) => updatePreference('instructor_courses_only', checked)}
                    />
                    <Label className="text-sm">My courses only</Label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Quiet Hours</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Start Time</Label>
                <input
                  type="time"
                  value={preferences.quiet_hours_start || ''}
                  onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">End Time</Label>
                <input
                  type="time"
                  value={preferences.quiet_hours_end || ''}
                  onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              During quiet hours, only urgent notifications will be sent
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences; 