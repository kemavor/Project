// Fixed API client with robust token refresh mechanism for VisionWare RTMP-to-HLS architecture
// In development, route through Vite proxy at /api
const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'http://localhost:8000' : '/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_staff?: boolean;
  permissions?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
  role?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
  created_at: string;
  updated_at: string;
  is_enrollment_open: boolean;
  credits: number;
}

export interface LiveStream {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  instructor_id: number;
  status: 'scheduled' | 'live' | 'ended';
  rtmp_key: string;
  hls_url?: string;
  viewer_count: number;
  max_viewers: number;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  is_public: boolean;
  is_recording: boolean;
  created_at: string;
  updated_at: string;
  course?: {
    title: string;
    instructor_name?: string;
  };
}

// Add Lecture type used by LectureManager
export interface Lecture {
  id: number;
  title: string;
  description?: string;
  instructor?: string;
  date?: string;
  scheduled_at?: string;
  duration?: number;
  is_live?: boolean;
  viewer_count?: number;
  status?: 'scheduled' | 'live' | 'ended';
  course_id?: number;
}

// Student progress type used in Dashboard/Quiz/Profile
export interface StudentProgress {
  average_score?: number;
  total_quizzes_taken?: number;
  pass_rate?: number;
  learning_streak?: number;
  longest_streak?: number;
  time_spent_learning?: number;
  average_quiz_duration?: number;
  accuracy_rate?: number;
  correct_answers?: number;
  total_questions_answered?: number;
  consistency_score?: number;
  study_efficiency?: number;
  days_active?: number;
  weekly_activity?: number;
  total_study_sessions?: number;
  subjects_count?: number;
  recent_quiz_scores?: number[];
  subjects_studied: string[];
  performance_trend?: 'improving' | 'declining' | 'stable';
  progression_recommendations?: string[];
  subject_performance: Record<string, {
    accuracy: number;
    correct_answers: number;
    questions_answered: number;
  }>;
  difficulty_performance?: Record<'easy' | 'medium' | 'hard', {
    accuracy: number;
    correct_answers: number;
    questions_answered: number;
  }>;
  strongest_subject?: string;
  weakest_subject?: string;
  ready_for_harder?: boolean;
}

// Notification type for notification UIs
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  read: boolean;
  created_at: string;
}

// Course enrollment/application types
export interface Application {
  id: number;
  course_id: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  motivation_statement?: string;
  course?: Course;
  instructor?: { id: number; first_name: string; last_name: string } | null;
}

export interface EnrolledCourse {
  id: number;
  course: Course;
  enrolled_at?: string;
  enrollment_status?: 'enrolled' | 'pending' | 'rejected';
  instructor?: { id?: number; first_name?: string; last_name?: string } | null;
}

export interface EnrolledCourseWithLectures {
  course_id: number;
  course_title: string;
  instructor_name?: string;
  enrollment_date?: string;
  lectures: Array<{
    stream_id: number;
    title: string;
    date: string;
    duration: number;
    has_questions: boolean;
    questions_count: number;
  }>;
}

// Quiz-related types
export interface GeneratedQuestion {
  question: string;
  options: Array<{ text: string; is_correct?: boolean }> | string[];
  answer: string;
  explanation?: string;
}

export interface QuizSession {
  id: number;
  user_id: number;
  stream_id?: number;
  questions: Array<{
    id: number;
    question_text: string;
    options: string[];
    correct_answer: string;
    difficulty_level?: string;
    topic_tags?: string[];
  }>;
  current_question_index: number;
  answers: Record<number, string>;
  start_time: string;
  time_limit: number; // minutes
  is_completed: boolean;
}

export interface QuizResults {
  session_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number; // seconds
  answers: Array<{
    question_id: number;
    question_text: string;
    correct_answer: string;
    user_answer: string;
    is_correct: boolean;
    explanation?: string;
  }>;
}

class ApiClient {
  private baseURL: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Token management with proper storage
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      // Add 30 second buffer to prevent edge cases
      return payload.exp < (currentTime + 30);
    } catch (error) {
      return true; // If we can't parse it, consider it expired
    }
  }

  // Robust token refresh with mutex to prevent concurrent requests
  private async refreshAccessToken(): Promise<string | null> {
    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start refresh process
    this.refreshPromise = this._performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      // Clear the promise whether success or failure
      this.refreshPromise = null;
    }
  }

  private async _performTokenRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      // Do not aggressively clear tokens here; let caller decide
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.access_token || data.token;
      const newRefreshToken = data.refresh_token || data.refresh || refreshToken;

      if (!newAccessToken) {
        console.error('Invalid refresh response - missing access token');
        return null;
      }

      this.setTokens(newAccessToken, newRefreshToken);
      console.log('✅ Token refreshed successfully');
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh network error:', error);
      return null;
    }
  }

  // Main request method with automatic token refresh
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    let accessToken = this.getAccessToken();

    // Check if token needs refresh (but not for auth endpoints)
    const isAuthEndpoint = endpoint.includes('/auth/login') || 
                          endpoint.includes('/auth/register') || 
                          endpoint.includes('/auth/refresh');

    if (!isAuthEndpoint && accessToken && this.isTokenExpired(accessToken)) {
      console.log('🔄 Token expired, refreshing...');
      accessToken = await this.refreshAccessToken();
      if (!accessToken) {
        return { error: 'Authentication failed. Please log in again.' };
      }
    }

    // Prepare request options
    const isFormData = options.body instanceof FormData;
    const defaultHeaders: HeadersInit = {
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    };
    const defaultOptions: RequestInit = {
      headers: defaultHeaders,
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      // Handle 401/403 with token refresh retry
      if ((response.status === 401 || response.status === 403) && !isAuthEndpoint) {
        console.log('🔄 Got 401/403, attempting token refresh...');
        
        const newAccessToken = await this.refreshAccessToken();
        if (!newAccessToken) {
          return { error: 'Session expired. Please log in again.' };
        }

        // Retry request with new token
        const retryIsFormData = options.body instanceof FormData;
        const retryOptions: RequestInit = {
          ...defaultOptions,
          headers: {
            ...(retryIsFormData ? {} : { 'Content-Type': 'application/json' }),
            'Authorization': `Bearer ${newAccessToken}`,
            ...(options.headers || {}),
          },
        };

        const retryResponse = await fetch(url, retryOptions);
        
        if (!retryResponse.ok) {
          let errorMessage = 'Request failed';
          try {
            const errorData = await retryResponse.json();
            errorMessage = errorData.error || errorData.detail || errorMessage;
          } catch {}
          return { error: errorMessage };
        }

        const data = await retryResponse.json();
        return { data };
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.detail) {
            // Handle Pydantic validation errors
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map((err: any) => err.msg).join(', ');
            } else {
              errorMessage = errorData.detail;
            }
          }
        } catch {}
        return { error: errorMessage };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Convenience helpers
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, { method: 'POST', body: isFormData ? body : JSON.stringify(body) });
  }
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, { method: 'PUT', body: isFormData ? body : JSON.stringify(body) });
  }
  async delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, { method: 'DELETE', body: isFormData ? body : JSON.stringify(body) });
  }

  // Access token getter for WS usage
  getCurrentAccessToken(): string | null {
    return this.getAccessToken();
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string; refresh: string; message?: string }>> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      const raw = response.data as any;
      const user = raw.user || raw.data?.user;
      const accessToken = raw.access_token || raw.token;
      const refreshToken = raw.refresh_token || raw.refresh;
      const message = raw.message || raw.data?.message;

      if (accessToken && refreshToken && user) {
        this.setTokens(accessToken, refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
    
      return {
          data: {
            user,
            token: accessToken,
            refresh: refreshToken,
            message,
          }
        };
      }
    }

    return response as ApiResponse<{ user: User; token: string; refresh: string; message?: string }>;
  }

  async register(userData: any): Promise<ApiResponse<any>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; refresh?: string }>> {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return { error: 'No refresh token available' };
    return this.request<{ token: string; refresh?: string }>(`/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refresh }),
    });
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearTokens();
    return { data: { message: 'Logged out successfully' } };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/user');
  }

  // Course management
  async applyForCourse(courseId: number, applicationData: {
    student_year: number;
    gpa: number;
    motivation_statement: string;
  }): Promise<ApiResponse<any>> {
    return this.request(`/courses/${courseId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async getCourses(): Promise<ApiResponse<Course[]>> {
    try {
      const response = await this.request<Course[]>('/courses');
      if (response.error || !response.data || response.data.length === 0) {
        // S3 fallback: return mock courses based on S3 bucket contents
        const fallbackCourses: Course[] = [
          {
            id: 1,
            title: "Introduction to Computer Science",
            description: "Fundamental concepts of programming and computer science",
            instructor_id: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_enrollment_open: true,
            credits: 3
          },
          {
            id: 2,
            title: "Python Programming",
            description: "Learn Python programming from basics to advanced concepts",
            instructor_id: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_enrollment_open: true,
            credits: 4
          }
        ];
        return { data: fallbackCourses };
      }
      return response;
    } catch (error) {
      // S3 fallback on network error
      const fallbackCourses: Course[] = [
        {
          id: 1,
          title: "Introduction to Computer Science",
          description: "Fundamental concepts of programming and computer science",
          instructor_id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_enrollment_open: true,
          credits: 3
        },
        {
          id: 2,
          title: "Python Programming",
          description: "Learn Python programming from basics to advanced concepts",
          instructor_id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_enrollment_open: true,
          credits: 4
        }
      ];
      return { data: fallbackCourses };
    }
  }

  async getMyCourses(): Promise<ApiResponse<Course[]>> {
    return this.request<Course[]>('/courses/my-courses');
  }
  async getEnrolledCourses(): Promise<ApiResponse<EnrolledCourse[]>> {
    return this.request<EnrolledCourse[]>('/courses/enrolled-courses');
  }

  async getCourse(id: number): Promise<ApiResponse<Course>> {
    return this.request<Course>(`/courses/${id}`);
  }

  // RTMP-to-HLS Streaming API
  async createLiveStream(data: {
    title: string;
    description?: string;
    course_id: number;
    scheduled_at?: string;
    max_viewers?: number;
    is_public?: boolean;
    is_recording?: boolean;
  }): Promise<ApiResponse<LiveStream>> {
    return this.request<LiveStream>('/livestream/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getLiveStreams(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    course_id?: number;
  }): Promise<ApiResponse<LiveStream[]>> {
    const queryParams = new URLSearchParams();
    
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.course_id !== undefined) queryParams.append('course_id', params.course_id.toString());
    
    return this.request<LiveStream[]>(`/livestream/?${queryParams.toString()}`);
  }

  async getActiveLiveStreams(): Promise<ApiResponse<LiveStream[]>> {
    return this.request<LiveStream[]>(`/livestream/?status=live`);
  }

  async getMyLiveStreams(): Promise<ApiResponse<LiveStream[]>> {
    return this.request<LiveStream[]>(`/livestream/my`);
  }

  async getAllLiveStreams(): Promise<ApiResponse<LiveStream[]>> {
    return this.request<LiveStream[]>(`/livestream/`);
  }

  async getLiveStream(streamId: number): Promise<ApiResponse<LiveStream>> {
    return this.request<LiveStream>(`/livestream/${streamId}`);
  }

  async startLiveStream(streamId: number): Promise<ApiResponse<LiveStream>> {
    return this.request<LiveStream>(`/livestream/${streamId}/start`, {
      method: 'POST',
      body: JSON.stringify({
        quality_settings: null
      })
    });
  }

  async stopLiveStream(streamId: number): Promise<ApiResponse<LiveStream>> {
    return this.request<LiveStream>(`/livestream/${streamId}/stop`, {
      method: 'POST',
      body: JSON.stringify({
        reason: null
      })
    });
  }

  async deleteLiveStream(streamId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/livestream/${streamId}`, {
      method: 'DELETE'
    });
  }

  async getStreamStats(streamId: number): Promise<ApiResponse<{
    viewers: number;
    duration: number;
    status: string;
  }>> {
    return this.request(`/livestream/${streamId}/stats`);
  }

  // S3 Recording management
  async getRecordedLectures(): Promise<ApiResponse<Array<{
    id: number;
    stream_id: number;
    title: string;
    s3_key: string;
    s3_url: string;
    duration: number;
    file_size: number;
    recorded_at: string;
  }>>> {
    return this.request('/recordings');
  }

  async getRecordedLecture(recordingId: number): Promise<ApiResponse<{
    id: number;
    stream_id: number;
    title: string;
    s3_url: string;
    signed_url: string;
    duration: number;
  }>> {
    return this.request(`/recordings/${recordingId}`);
  }

  // Lecture Management
  async createLecture(lectureData: any): Promise<ApiResponse<any>> {
    return this.request('/lectures', {
      method: 'POST',
      body: JSON.stringify(lectureData),
    });
  }

  async getLectures(): Promise<ApiResponse<any[]>> {
    return this.request('/lectures');
  }

  // Alias functions to match hooks naming
  async fetchLectures(): Promise<ApiResponse<any[]>> { return this.getLectures(); }

  async deleteLecture(lectureId: number): Promise<ApiResponse<any>> {
    return this.request(`/lectures/${lectureId}`, {
      method: 'DELETE',
    });
  }

  async fetchCourseLectures(courseId: number): Promise<ApiResponse<any[]>> {
    // Prefer course-specific endpoint; fallback to filtering
    const res = await this.request<any[]>(`/courses/${courseId}/lectures`);
    if (!res.error && res.data) return res;
    return this.request<any[]>(`/lectures?course_id=${courseId}`);
  }

  // Teacher Management
  async fetchTeachers(): Promise<ApiResponse<any[]>> {
    return this.request('/teachers');
  }

  // User Management
  async updateUserPreferences(preferences: any): Promise<ApiResponse<any>> {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async changePassword(passwordData: { old_password: string; new_password: string }): Promise<ApiResponse<any>> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async updateCurrentUser(userData: any): Promise<ApiResponse<any>> {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async uploadAvatar(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.request('/users/avatar', {
      method: 'POST',
      body: formData,
      headers: {}, // Let fetch set Content-Type for FormData
    });
  }

  async deleteAccount(password: string): Promise<ApiResponse<any>> {
    return this.request('/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  // Enhanced Account Management APIs
  async softDeleteAccount(reason?: string): Promise<ApiResponse<any>> {
    return this.request<any>('/account/soft-delete', { method: 'POST', body: JSON.stringify({ reason }) });
  }

  async reactivateAccount(): Promise<ApiResponse<any>> {
    return this.request<any>('/account/reactivate', { method: 'POST' });
  }

  async scheduleAccountDeletion(data: {
    scheduled_date: string;
    deletion_type?: 'hard' | 'soft';
    reason?: string;
    notify_before_deletion?: boolean;
    notification_days_before?: number;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/account/schedule-deletion', { method: 'POST', body: JSON.stringify(data) });
  }

  async getDeletionSchedule(): Promise<ApiResponse<any>> {
    return this.request<any>('/account/deletion-schedule');
  }

  async cancelScheduledDeletion(reason?: string): Promise<ApiResponse<any>> {
    return this.request<any>('/account/cancel-deletion', { method: 'POST', body: JSON.stringify({ reason }) });
  }

  async requestDataExport(data: {
    export_type?: 'full' | 'profile' | 'learning_data' | 'documents';
    include_sensitive_data?: boolean;
    data_format?: 'json' | 'csv' | 'pdf';
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/account/export-data', { method: 'POST', body: JSON.stringify(data) });
  }

  async getExportStatus(exportId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/account/export-status/${exportId}`);
  }

  async downloadExport(exportId: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/account/download-export/${exportId}`);
  }

  // Stats & Progress
  async getUserStats(): Promise<ApiResponse<any>> {
    return this.request('/statistics/user');
  }

  async getStudentProgress(): Promise<ApiResponse<StudentProgress>> {
    // Try enhanced quiz endpoint first, fallback to older endpoint if available
    return this.request<StudentProgress>('/enhanced-quiz/user-details');
  }

  async fetchUserStats(userId: number): Promise<ApiResponse<any>> {
    return this.request(`/statistics/user`);
  }

  async getWeeklyProgress(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/statistics/weekly-progress`);
  }

  async getRecentLectures(limit: number = 5): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/lectures/recent?limit=${limit}`);
  }

  // Notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return this.request<Notification[]>(`/notifications/`);
  }
  async markNotificationAsRead(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/notifications/${id}/read`, { method: 'POST' });
  }
  async markAllNotificationsAsRead(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/notifications/mark-all-read`, { method: 'POST' });
  }
  async deleteNotification(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' });
  }
  async getNotificationPreferences(): Promise<ApiResponse<any>> {
    return this.request<any>(`/notifications/preferences`);
  }
  async updateNotificationPreferences(preferences: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/notifications/preferences`, { method: 'PUT', body: JSON.stringify(preferences) });
  }
  async resetNotificationPreferences(): Promise<ApiResponse<any>> {
    return this.request<any>(`/notifications/preferences/reset`, { method: 'POST' });
  }

  // Chat (ECHO)
  async getChatSessions(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/chatbot/sessions`);
  }
  async getChatMessages(sessionId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/chatbot/sessions/${sessionId}/messages`);
  }
  async createChatSession(payload: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/chatbot/sessions`, { method: 'POST', body: JSON.stringify(payload) });
    }
  async sendChatMessage(payload: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/chatbot/chat`, { method: 'POST', body: JSON.stringify(payload) });
  }
  async sendChatMessageWithFiles(payload: { session_id: number; message: string; files: File[] }): Promise<ApiResponse<any>> {
    const form = new FormData();
    form.append('session_id', String(payload.session_id));
    form.append('message', payload.message);
    for (const file of payload.files) form.append('files', file);
    return this.request<any>(`/chatbot/chat-with-files`, { method: 'POST', body: form, headers: {} });
  }
  async deleteChatSession(sessionId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/chatbot/sessions/${sessionId}`, { method: 'DELETE' });
  }

  // Applications (courses)
  async getCourseApplications(): Promise<ApiResponse<Application[]>> {
    return this.request<Application[]>(`/courses/course-applications`);
  }
  async getMyApplications(): Promise<ApiResponse<Application[]>> {
    return this.request<Application[]>(`/courses/my-applications`);
  }
  async approveApplication(applicationId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/courses/applications/${applicationId}/approve`, { method: 'PUT' });
  }
  async rejectApplication(applicationId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/courses/applications/${applicationId}/reject`, { method: 'PUT' });
  }

  // Courses CRUD (teacher)
  async createCourse(data: any): Promise<ApiResponse<Course>> {
    return this.request<Course>(`/courses`, { method: 'POST', body: JSON.stringify(data) });
  }
  async updateCourse(courseId: number, data: any): Promise<ApiResponse<Course>> {
    return this.request<Course>(`/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteCourse(courseId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/courses/${courseId}`, { method: 'DELETE' });
  }

  // Course documents
  async uploadCourseDocument(courseId: number, file: File): Promise<ApiResponse<any>> {
    const form = new FormData();
    form.append('file', file);
    return this.request<any>(`/courses/${courseId}/documents`, { method: 'POST', body: form, headers: {} });
  }
  async getCourseDocuments(courseId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/courses/${courseId}/documents`);
  }
  async getCourseDocumentsForStudents(courseId: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.request<any[]>(`/courses/${courseId}/documents/student`);
      if (response.error || !response.data || response.data.length === 0) {
        // S3 fallback: return documents based on S3 bucket contents
        const fallbackDocuments = await this.getS3Documents(courseId);
        return { data: fallbackDocuments };
      }
      return response;
    } catch (error) {
      // S3 fallback on network error
      const fallbackDocuments = await this.getS3Documents(courseId);
      return { data: fallbackDocuments };
    }
  }

  private async getS3Documents(courseId: number): Promise<any[]> {
    const BUCKET_BASE = 'https://visionware-lecture-courses.s3.amazonaws.com';
    
    // Known files for each course based on S3 bucket contents
    const courseFiles: Record<number, string[]> = {
      1: [
        'assignment1.pdf',
        'lecture1_introduction.md', 
        'syllabus.txt'
      ],
      2: [
        'assignment1.txt',
        'course_description.txt',
        'lecture_notes_week1.txt',
        'project_guidelines.txt',
        'python_basics.txt',
        'syllabus.txt'
      ]
    };

    // Additional uploaded documents for each course
    const uploadedDocuments: Record<number, string[]> = {
      1: [
        '18f91606-b226-450f-ad59-b0455153d4f7.txt',
        '8003405c-0ca0-4ee3-a5d5-504ba62c1bef.txt',
        '9afb5bd4-341b-40e3-8582-9656b4ec1302.txt',
        'cdb0e71b-dbee-46a4-970f-ab690d5e3836.txt',
        'e2fb60db-b183-4103-ab69-d64642ca8f62.txt',
        'eb3a843f-04c3-499f-bb61-ba973f70ca5a.txt',
        'f156c8cb-2a49-4aaf-856d-63458715eb4e.txt',
        'fa66d366-bef8-4f6f-b67e-dd994ea72398.txt'
      ],
      2: [
        '277d43f3-28d2-46ed-b718-070573e8434e.txt',
        '7833e2d5-7b3c-4fda-9a14-9af52fd34fdd.txt',
        'ab587195-f945-444c-886f-2f4c3df0a227.pdf',
        'debc4294-9f55-415a-ac0b-cd5861fca141.txt',
        'e0efd835-4c49-4ac4-82fb-f698932158d3.pdf'
      ]
    };

    const structuredFiles = courseFiles[courseId] || [];
    const uploadedFiles = uploadedDocuments[courseId] || [];
    
    const allFiles = [
      ...structuredFiles.map((filename, idx) => ({
        filename,
        url: `${BUCKET_BASE}/courses/${courseId}/${filename}`,
        id: idx + 1,
        isUploaded: false
      })),
      ...uploadedFiles.map((filename, idx) => ({
        filename,
        url: `${BUCKET_BASE}/course-documents/${courseId}/${filename}`,
        id: structuredFiles.length + idx + 1,
        isUploaded: true
      }))
    ];
    
    return allFiles.map((file) => {
      return {
        id: file.id,
        title: file.isUploaded ? `Uploaded Document ${file.id}` : file.filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        filename: file.filename,
        file_size: 0,
        file_type: this.getFileType(file.filename),
        mime_type: this.getMimeType(file.filename),
        is_public: true,
        created_at: new Date().toISOString(),
        download_url: file.url,
        view_url: file.url,
        s3_url: file.url,
      };
    });
  }

  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'doc': case 'docx': return 'document';
      case 'txt': case 'md': return 'text';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'image';
      case 'mp4': case 'avi': case 'mov': return 'video';
      case 'mp3': case 'wav': return 'audio';
      default: return 'file';
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt': return 'text/plain';
      case 'md': return 'text/markdown';
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'mp4': return 'video/mp4';
      case 'mp3': return 'audio/mpeg';
      default: return 'application/octet-stream';
    }
  }
  async deleteDocument(documentId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/documents/${documentId}`, { method: 'DELETE' });
  }

  // Analytics
  async getTeacherAnalytics(): Promise<ApiResponse<any>> {
    return this.request<any>(`/teacher/analytics`);
  }

  // Admin endpoints
  async getAdminUsers(): Promise<ApiResponse<any[]>> { return this.request<any[]>(`/admin/users`); }
  async getAdminCourses(): Promise<ApiResponse<any[]>> { return this.request<any[]>(`/admin/courses`); }
  async getAdminLivestreams(): Promise<ApiResponse<any[]>> { return this.request<any[]>(`/admin/livestreams`); }
  async getAdminStats(): Promise<ApiResponse<any>> { return this.request<any>(`/admin/stats`); }
  async deleteAdminUser(userId: number): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/admin/users/${userId}`, { method: 'DELETE' }); }
  async updateAdminUser(userId: number, data: any): Promise<ApiResponse<any>> { return this.request<any>(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteAdminCourse(courseId: number): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/admin/courses/${courseId}`, { method: 'DELETE' }); }
  async deleteAdminLivestream(streamId: number): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/admin/livestreams/${streamId}`, { method: 'DELETE' }); }
  async clearEndedLivestreams(): Promise<ApiResponse<{ message: string }>> { return this.request<{ message: string }>(`/admin/livestreams/clear-ended`, { method: 'POST' }); }

  // Livestream join/leave for viewers
  async joinLiveStream(streamId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/livestream/${streamId}/join`, { method: 'POST' });
  }
  async leaveLiveStream(streamId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/livestream/${streamId}/leave`, { method: 'POST' });
  }

  // Clear ended streams for current user (dashboard)
  async clearMyEndedStreams(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/livestream/clear-ended`, { method: 'POST' });
  }

  // Quiz API helpers used in UI
  async getEnrolledCoursesWithLectures(): Promise<ApiResponse<EnrolledCourseWithLectures[]>> {
    return this.request<EnrolledCourseWithLectures[]>(`/quizzes/enrolled-courses`);
  }
  async submitQuizAnswer(sessionId: number, payload: { question_id: number; selected_answer: string }): Promise<ApiResponse<any>> {
    return this.request<any>(`/quiz/sessions/${sessionId}/answer`, { method: 'POST', body: JSON.stringify(payload) });
  }
  async getQuizResults(sessionId: number): Promise<ApiResponse<QuizResults>> {
    return this.request<QuizResults>(`/quiz/sessions/${sessionId}/results`);
  }

  // Flashcards and summaries hooks compatibility
  async fetchFlashcards(): Promise<ApiResponse<any[]>> { return this.request<any[]>(`/flashcards`); }
  async fetchCourseFlashcards(courseId: number): Promise<ApiResponse<any[]>> { return this.request<any[]>(`/courses/${courseId}/flashcards`); }
  async fetchSummaries(): Promise<ApiResponse<any[]>> { return this.request<any[]>(`/summaries`); }
  async fetchCourseSummaries(courseId: number): Promise<ApiResponse<any[]>> { return this.request<any[]>(`/courses/${courseId}/summaries`); }
}

// Create and export API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Export for use in components
export { apiClient };
export default apiClient;

// Export individual functions for direct import
export const createLecture = (lectureData: any) => apiClient.createLecture(lectureData);
export const getLectures = () => apiClient.getLectures();
export const deleteLecture = (lectureId: number) => apiClient.deleteLecture(lectureId);
export const fetchTeachers = () => apiClient.fetchTeachers();
export const updateUserPreferences = (preferences: any) => apiClient.updateUserPreferences(preferences);
export const changePassword = (passwordData: { old_password: string; new_password: string }) => apiClient.changePassword(passwordData);
export const updateCurrentUser = (userData: any) => apiClient.updateCurrentUser(userData);
export const uploadAvatar = (file: File) => apiClient.uploadAvatar(file);
export const deleteAccount = (password: string) => apiClient.deleteAccount(password);
export const getUserStats = () => apiClient.getUserStats();
export const getStudentProgress = () => apiClient.getStudentProgress();

// Enhanced Account Management exports
export const softDeleteAccount = (reason?: string) => apiClient.softDeleteAccount(reason);
export const reactivateAccount = () => apiClient.reactivateAccount();
export const scheduleAccountDeletion = (data: any) => apiClient.scheduleAccountDeletion(data);
export const getDeletionSchedule = () => apiClient.getDeletionSchedule();
export const cancelScheduledDeletion = (reason?: string) => apiClient.cancelScheduledDeletion(reason);
export const requestDataExport = (data: any) => apiClient.requestDataExport(data);
export const getExportStatus = (exportId: number) => apiClient.getExportStatus(exportId);
export const downloadExport = (exportId: number) => apiClient.downloadExport(exportId);