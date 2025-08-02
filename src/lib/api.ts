// API configuration for connecting to FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

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
  is_staff: boolean;
  role?: string | { role_type: string; name?: string };
  permissions?: string[];
  stats?: {
    coursesCreated?: number;
    averageRating?: number;
    lecturesAttended?: number;
    quizzesCompleted?: number;
    averageScore?: number;
    studyStreak?: number;
    flashcardsReviewed?: number;
    quizAverage?: number;
    learningStreak?: number;
    lecturesConducted?: number;
    activeStudents?: number;
    lectures_attended?: number; // Legacy support
    flashcards_reviewed?: number; // Legacy support
    quiz_average?: number; // Legacy support
    learning_streak?: number; // Legacy support
  };
  preferences?: {
    notifications?: boolean;
    language?: string;
    theme?: string;
    emailUpdates?: boolean;
  };
  avatar?: string;
  age?: number;
  sex?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  profile_picture?: string;
  joinedAt?: string;
  name?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  role?: string; // Optional role for role-specific login
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string; // User role: student, teacher, admin
}

export interface OAuthCallbackRequest {
  provider: string;
  code: string;
  state?: string;
  role: 'student' | 'teacher' | 'admin';
  redirect_uri: string;
}

export interface LinkOAuthAccountRequest {
  provider: string;
  code: string;
  redirect_uri: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get JWT token from localStorage
    const token = localStorage.getItem('access_token');
    
    // Debug logging
    console.log(`🔐 API Request to: ${endpoint}`);
    console.log(`🔑 Token available: ${!!token}`);
    if (token) {
      console.log(`🔑 Token preview: ${token.substring(0, 20)}...`);
    }
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      // Debug logging
      console.log(`📡 Response status: ${response.status}`);
      
      // Handle 401 Unauthorized - try token refresh first
      if (response.status === 401 || response.status === 403) {
        console.warn('Authentication failed, attempting token refresh...');
        
        // Try to refresh the token
        const refreshResponse = await this.refreshToken();
        
        if (refreshResponse.data) {
          // Token refreshed successfully, retry the original request
          console.log('Token refreshed successfully, retrying request...');
          const newToken = localStorage.getItem('access_token');
          
          const retryOptions: RequestInit = {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...(newToken && { 'Authorization': `Bearer ${newToken}` }),
              ...options.headers,
            },
          };
          
          const retryResponse = await fetch(url, retryOptions);
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            return { data };
          }
        }
        
        // If refresh failed or retry failed, clear tokens and redirect
        console.warn('Token refresh failed, clearing tokens and redirecting to login');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login';
        
        return {
          error: 'Authentication failed. Please log in again.'
        };
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; message: string; token: string; refresh: string }>> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Handle successful login response
    if (response.data && typeof response.data === 'object') {
      const data = response.data as any;
      
      // Store JWT token in localStorage if login is successful
      if (data.token) {
        localStorage.setItem('access_token', data.token);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
      }
      
      // Transform FastAPI response format to match expected format
      return {
        data: {
          user: data.data?.user || data.user,
          message: data.message || 'Login successful',
          token: data.token,
          refresh: data.refresh
        }
      };
    }
    
    return response as ApiResponse<{ user: User; message: string; token: string; refresh: string }>;
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.request('/auth/user');
    
    // The backend returns { success: true, data: userData }
    // We need to extract the user data from the response
    if (response.data && response.data.success && response.data.data) {
      return { data: response.data.data };
    }
    
    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async oauthCallback(data: OAuthCallbackRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/oauth/callback/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateOAuthToken(token: string): Promise<ApiResponse<any>> {
    return this.request('/auth/oauth/validate/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async linkOAuthAccount(data: LinkOAuthAccountRequest): Promise<ApiResponse<any>> {
    return this.request('/auth/oauth/link/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unlinkOAuthAccount(provider: string): Promise<ApiResponse<any>> {
    return this.request(`/auth/oauth/unlink/${provider}/`, {
      method: 'POST',
    });
  }

  // Course endpoints
  async getCourses() {
    const response = await this.request('/courses');
    
    // If the API returns an error (like 404), return mock data
    if (response.error) {
      console.warn('Courses endpoint not available, using mock data');
      return {
        data: [
          {
            id: 1,
            name: "Machine Learning Fundamentals",
            title: "Machine Learning Fundamentals",
            description: "Introduction to machine learning concepts and algorithms",
            year: 2,
            instructor_id: 8, // Updated to match current teacher user ID
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
            is_enrollment_open: true,
            credits: 3,
            instructor: "Dr. Sarah Chen",
            document_filename: "ml-fundamentals.pdf",
            signed_url: null,
            can_enroll: { can_enroll: true, message: "You can enroll in this course" },
            current_user_application: null,
            max_students: 50,
            enrolled_students_count: 25,
            available_spots: 25,
            prerequisites: "Basic programming knowledge",
            files: []
          },
          {
            id: 2,
            name: "Deep Learning with Neural Networks",
            title: "Deep Learning with Neural Networks",
            description: "Advanced neural network architectures and training",
            year: 3,
            instructor_id: 8, // Updated to match current teacher user ID
            created_at: "2024-01-20T10:00:00Z",
            updated_at: "2024-01-20T10:00:00Z",
            is_enrollment_open: true,
            credits: 4,
            instructor: "Prof. Michael Brown",
            document_filename: "deep-learning.pdf",
            signed_url: null,
            can_enroll: { can_enroll: true, message: "You can enroll in this course" },
            current_user_application: null,
            max_students: 40,
            enrolled_students_count: 30,
            available_spots: 10,
            prerequisites: "Machine Learning Fundamentals",
            files: []
          },
          {
            id: 3,
            name: "Computer Vision Basics",
            title: "Computer Vision Basics",
            description: "Learn image processing and computer vision techniques",
            year: 2,
            instructor_id: 8, // Updated to match current teacher user ID
            created_at: "2024-01-25T10:00:00Z",
            updated_at: "2024-01-25T10:00:00Z",
            is_enrollment_open: true,
            credits: 3,
            instructor: "Dr. Sarah Chen",
            document_filename: "computer-vision.pdf",
            signed_url: null,
            can_enroll: { can_enroll: true, message: "You can enroll in this course" },
            current_user_application: null,
            max_students: 45,
            enrolled_students_count: 20,
            available_spots: 25,
            prerequisites: "Basic mathematics",
            files: []
          },
          {
            id: 4,
            name: "Natural Language Processing",
            title: "Natural Language Processing",
            description: "Understanding and processing human language with AI",
            year: 3,
            instructor_id: 8, // Updated to match current teacher user ID
            created_at: "2024-01-30T10:00:00Z",
            updated_at: "2024-01-30T10:00:00Z",
            is_enrollment_open: true,
            credits: 4,
            instructor: "Prof. Michael Brown",
            document_filename: "nlp-basics.pdf",
            signed_url: null,
            can_enroll: { can_enroll: true, message: "You can enroll in this course" },
            current_user_application: null,
            max_students: 35,
            enrolled_students_count: 15,
            available_spots: 20,
            prerequisites: "Machine Learning Fundamentals",
            files: []
          },
          {
            id: 5,
            name: "CENG 415",
            title: "CENG 415",
            description: "Engineering in Society",
            year: 4,
            instructor_id: 8, // Updated to match current teacher user ID
            created_at: "2025-07-21T19:31:31Z",
            updated_at: "2025-07-21T19:31:38Z",
            is_enrollment_open: true,
            credits: 3,
            instructor: "test_teacher",
            document_filename: "ceng415.pdf",
            signed_url: null,
            can_enroll: { can_enroll: true, message: "You can enroll in this course" },
            current_user_application: null,
            max_students: 50,
            enrolled_students_count: 0,
            available_spots: 50,
            prerequisites: "Engineering fundamentals",
            files: []
          }
        ]
      };
    }
    return response;
  }

  // Teacher course management endpoints
  async getMyCourses(): Promise<ApiResponse<Course[] | EnrolledCourse[]>> {
    // Get current user to determine role
    const currentUser = await this.getCurrentUser();
    if (currentUser.error) {
      return { error: 'Failed to get current user' };
    }
    
    const user = currentUser.data;
    if (!user) {
      return { error: 'User not authenticated' };
    }
    
    // Call different endpoints based on user role
    if (user.role === 'teacher') {
      // For now, let's use the general courses endpoint and filter on frontend
      // This is a temporary fix until we add proper my-courses endpoint
      const allCourses = await this.getCourses();
      if (allCourses.error) {
        return allCourses;
      }
      
      // Filter courses for this teacher
      const teacherCourses = (allCourses.data || []).filter(
        (course: Course) => course.instructor_id === user.id
      );
      
      return { data: teacherCourses };
    } else if (user.role === 'student') {
      return this.request<Course[]>('/courses/enrolled-courses');
    } else {
      return { error: 'Invalid user role' };
    }
  }

  async createCourse(courseData: {
    title: string;
    description: string;
    credits: number;
    is_enrollment_open: boolean;
  }) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(courseId: number, courseData: {
    title?: string;
    description?: string;
    credits?: number;
    is_enrollment_open?: boolean;
  }) {
    return this.request(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(courseId: number) {
    return this.request(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  // Course Document Management
  async uploadCourseDocument(
    courseId: number,
    file: File,
    title?: string,
    description?: string,
    isPublic: boolean = true
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('is_public', isPublic.toString());

    // Get JWT token from localStorage
    const token = localStorage.getItem('access_token');
    
    const url = `${this.baseURL}/documents/courses/${courseId}/upload`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let the browser set it with boundary
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        return {
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async getCourseDocuments(courseId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/documents/courses/${courseId}`);
  }

  async getDocument(documentId: number): Promise<ApiResponse<any>> {
    return this.request(`/documents/${documentId}`);
  }

  async updateDocument(
    documentId: number,
    data: {
      title?: string;
      description?: string;
      is_public?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    return this.request(`/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(documentId: number): Promise<ApiResponse<any>> {
    return this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async getCourse(id: number) {
    return this.request(`/courses/${id}/`);
  }

  async applyForCourse(courseId: number, applicationData: {
    student_year: number;
    gpa: number;
    motivation_statement: string;
  }) {
    return this.request(`/courses/${courseId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async getMyApplications() {
    return this.request('/courses/my-applications');
  }

  async getCourseApplications() {
    return this.request('/courses/course-applications');
  }

  async approveApplication(applicationId: number) {
    try {
      console.log(`🎯 Approving application ID: ${applicationId}`);
      
      const response = await this.request(`/courses/applications/${applicationId}/approve`, {
        method: 'PUT',
      });
      
      console.log(`📡 Approval response:`, response);
      
      if (response.error) {
        console.error('Application approval failed:', response.error);
        return response;
      }
      
      console.log('✅ Application approved successfully');
      return response;
    } catch (error) {
      console.error('Error approving application:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to approve application'
      };
    }
  }

  async rejectApplication(applicationId: number) {
    try {
      console.log(`🎯 Rejecting application ID: ${applicationId}`);
      
      const response = await this.request(`/courses/applications/${applicationId}/reject`, {
        method: 'PUT',
      });
      
      console.log(`📡 Rejection response:`, response);
      
      if (response.error) {
        console.error('Application rejection failed:', response.error);
        return response;
      }
      
      console.log('✅ Application rejected successfully');
      return response;
    } catch (error) {
      console.error('Error rejecting application:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to reject application'
      };
    }
  }

  // Notification endpoints
  async getNotifications() {
    // Try the notifications endpoint, but handle 422 errors gracefully
    try {
      return this.request('/notifications');
    } catch (error) {
      console.warn('Notifications endpoint not available, returning empty array');
      return { data: [] };
    }
  }

  async getUnreadNotifications() {
    // Try the unread notifications endpoint, but handle 422 errors gracefully
    try {
      return this.request('/notifications/unread');
    } catch (error) {
      console.warn('Unread notifications endpoint not available, returning empty array');
      return { data: [] };
    }
  }

  async markNotificationAsRead(notificationId: number) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId: number) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async getCourseDocumentsForStudents(courseId: number) {
    return this.request(`/courses/${courseId}/documents`);
  }



  async getDocumentDownloadUrl(documentId: number) {
    return this.request(`/courses/documents/${documentId}/download`);
  }

  // Application management
  async getApplication(id: number) {
    return this.request(`/applications/${id}/`);
  }

  async updateApplication(id: number, data: any) {
    return this.request(`/applications/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Lecture management
  async getLectures() {
    try {
      const response = await this.request('/lectures/');
      return response;
    } catch (error) {
      // Return mock data if backend endpoint doesn't exist
      console.warn('Lectures endpoint not available, using mock data');
      return {
        data: [
          {
            id: 1,
            title: "Introduction to Supervised Learning",
            description: "Learn the basics of supervised learning algorithms",
            course_id: 1,
            instructor_id: 1,
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
            video_url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
            duration: 3600,
            is_live: false,
            instructor: "Dr. Sarah Chen",
            viewer_count: 0
          },
          {
            id: 2,
            title: "Neural Network Architecture",
            description: "Understanding neural network layers and activation functions",
            course_id: 2,
            instructor_id: 2,
            created_at: "2024-01-20T10:00:00Z",
            updated_at: "2024-01-20T10:00:00Z",
            video_url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
            duration: 4800,
            is_live: true,
            instructor: "Prof. Michael Brown",
            viewer_count: 25
          }
        ]
      };
    }
  }

  async getLecture(id: number) {
    try {
      const response = await this.request(`/lectures/${id}`);
      return response;
    } catch (error) {
      // Return mock data if backend endpoint doesn't exist
      console.warn('Lecture endpoint not available, using mock data');
      return {
        data: {
          id: id,
          title: "Sample Lecture",
          description: "This is a sample lecture for demonstration purposes",
          course_id: 1,
          instructor_id: 1,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
          video_url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
          duration: 3600,
          is_live: false,
          instructor: "Dr. Sarah Chen",
          viewer_count: 0
        }
      };
    }
  }

  async createLecture(lectureData: any) {
    return this.request('/lectures/', {
      method: 'POST',
      body: JSON.stringify(lectureData),
    });
  }

  async deleteLecture(id: number) {
    return this.request(`/lectures/${id}/`, {
      method: 'DELETE',
    });
  }

  // Teacher management
  async fetchTeachers() {
    return this.request('/teachers/');
  }

  // User management
  async updateCurrentUser(userData: any) {
    return this.request('/auth/profile/update/', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async updateUserPreferences(preferences: any) {
    return this.request('/auth/preferences/update/', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  }

  async changePassword(passwordData: { old_password: string; new_password: string }) {
    return this.request('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async getUserStats() {
    const response = await this.request('/statistics/user');
    
    // Transform FastAPI response format
    if (response.data) {
      return {
        data: response.data
      };
    }
    
    return response;
  }

  async getWeeklyProgress() {
    const response = await this.request('/statistics/weekly-progress');
    
    // Transform FastAPI response format
    if (response.data) {
      return {
        data: response.data
      };
    }
    
    return response;
  }

  async recordActivity(activityData: {
    activity_type: string;
    activity_id?: number;
    duration_minutes: number;
    score?: number;
    completed?: boolean;
  }) {
    return this.request('/statistics/activity', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  async forgotPassword(emailData: { email: string }) {
    return this.request('/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  // File upload
  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/upload/', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  // Additional API methods for missing functions
  async fetchFlashcards() {
    return this.request('/flashcards/');
  }

  async fetchCourseFlashcards(courseId: number) {
    return this.request(`/courses/${courseId}/flashcards/`);
  }

  async fetchQuizzes() {
    return this.request('/quizzes/');
  }

  async fetchCourseQuizzes(courseId: number) {
    return this.request(`/courses/${courseId}/quizzes/`);
  }

  async fetchSummaries() {
    return this.request('/summaries/');
  }

  async fetchCourseSummaries(courseId: number) {
    return this.request(`/courses/${courseId}/summaries/`);
  }

  async fetchLectures() {
    return this.getLectures();
  }

  async fetchCourseLectures(courseId: number) {
    return this.request(`/courses/${courseId}/lectures/`);
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Try the main avatar endpoint first
    const response = await this.request('/auth/avatar/', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
    
    // If that fails, try alternative endpoints
    if (response.error) {
      const alternativeEndpoints = [
        '/auth/profile/avatar/',
        '/user/avatar/',
        '/profile/avatar/'
      ];
      
      for (const endpoint of alternativeEndpoints) {
        try {
          const altResponse = await this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {},
          });
          if (altResponse.data) {
            return altResponse;
          }
        } catch (error) {
          console.warn(`Failed to upload avatar to ${endpoint}:`, error);
        }
      }
    }
    
    return response;
  }

  async deleteAccount(password: string) {
    return this.request('/auth/delete/', {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // HTTP method shortcuts for backwards compatibility
  async get(url: string, config?: any) {
    return this.request(url, { method: 'GET', ...config });
  }

  async post(url: string, data?: any, config?: any) {
    return this.request(url, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined,
      ...config 
    });
  }

  async put(url: string, data?: any, config?: any) {
    return this.request(url, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined,
      ...config 
    });
  }

  async delete(url: string, config?: any) {
    return this.request(url, { method: 'DELETE', ...config });
  }

  // Live Streaming API
  async createLiveStream(data: {
    title: string;
    description?: string;
    course_id: number;
    scheduled_at?: string;
    max_viewers?: number;
    is_public?: boolean;
    is_recording?: boolean;
    quality_settings?: any;
  }) {
    return this.request('/livestream/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getLiveStreams(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    course_id?: number;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.course_id !== undefined) queryParams.append('course_id', params.course_id.toString());
    
    return this.request(`/livestream/?${queryParams.toString()}`);
  }

  async getActiveLiveStreams() {
    return this.request('/livestream/active');
  }

  async getLiveStream(streamId: number) {
    return this.request(`/livestream/${streamId}`);
  }

  async updateLiveStream(streamId: number, data: {
    title?: string;
    description?: string;
    scheduled_at?: string;
    max_viewers?: number;
    is_public?: boolean;
    is_recording?: boolean;
    quality_settings?: any;
  }) {
    return this.request(`/livestream/${streamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async startLiveStream(streamId: number, qualitySettings?: any) {
    return this.request(`/livestream/${streamId}/start`, {
      method: 'POST',
      body: JSON.stringify({ quality_settings: qualitySettings }),
    });
  }

  async stopLiveStream(streamId: number, reason?: string) {
    console.log('🔐 API Stop Request to:', `/livestream/${streamId}/stop`);
    console.log('📋 Request body:', { reason });
    return this.request(`/livestream/${streamId}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
  }

  async deleteLiveStream(streamId: number) {
    console.log('🔐 API Delete Request to:', `/livestream/${streamId}`);
    return this.request(`/livestream/${streamId}`, {
      method: 'DELETE',
    });
  }

  async joinLiveStream(streamId: number) {
    return this.request(`/livestream/${streamId}/join`, {
      method: 'POST',
    });
  }

  async leaveLiveStream(streamId: number) {
    return this.request(`/livestream/${streamId}/leave`, {
      method: 'POST',
    });
  }

  async getStreamStats(streamId: number) {
    return this.request(`/livestream/${streamId}/stats`);
  }

  async sendStreamChatMessage(streamId: number, message: string, messageType: string = 'text') {
    return this.request(`/livestream/${streamId}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        message_type: messageType,
      }),
    });
  }

  async getStreamChatMessages(streamId: number, skip?: number, limit?: number) {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append('skip', skip.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    
    return this.request(`/livestream/${streamId}/chat?${params.toString()}`);
  }

  async askQuestion(streamId: number, question: string) {
    return this.request(`/livestream/${streamId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async getQuestions(streamId: number, skip?: number, limit?: number) {
    const queryParams = new URLSearchParams();
    if (skip !== undefined) queryParams.append('skip', skip.toString());
    if (limit !== undefined) queryParams.append('limit', limit.toString());
    
    return this.request(`/livestream/${streamId}/questions?${queryParams.toString()}`);
  }

  async upvoteQuestion(streamId: number, questionId: number) {
    return this.request(`/livestream/${streamId}/questions/${questionId}/upvote`, {
      method: 'POST',
    });
  }

  async answerQuestion(streamId: number, questionId: number, answer: string) {
    return this.request(`/livestream/${streamId}/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  // Chatbot API Methods
  async createChatSession(sessionData: {
    course_id?: number;
    session_name?: string;
  }) {
    return this.request('/chatbot/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getChatSessions() {
    return this.request('/chatbot/sessions');
  }

  async getChatMessages(sessionId: number) {
    return this.request(`/chatbot/sessions/${sessionId}/messages`);
  }

  async sendChatMessage(request: {
    message: string;
    session_id?: number;
    course_id?: number;
    include_course_content?: boolean;
  }) {
    return this.request('/chatbot/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendChatMessageWithFiles(request: {
    session_id: number;
    message: string;
    course_id?: number;
    files: File[];
  }) {
    const formData = new FormData();
    formData.append('session_id', request.session_id.toString());
    formData.append('message', request.message);
    
    if (request.course_id) {
      formData.append('course_id', request.course_id.toString());
    }
    
    // Add files to form data
    request.files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${this.baseURL}/chatbot/chat-with-files`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    return { data };
  }

  async analyzeCourseContent(courseId: number) {
    return this.request(`/chatbot/analyze-course/${courseId}`, {
      method: 'POST',
    });
  }

  async deleteChatSession(sessionId: number) {
    return this.request(`/chatbot/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Notification Preferences
  async getNotificationPreferences(): Promise<ApiResponse<any>> {
    return this.request('/notifications/preferences');
  }

  async updateNotificationPreferences(preferences: any): Promise<ApiResponse<any>> {
    return this.request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async resetNotificationPreferences(): Promise<ApiResponse<any>> {
    return this.request('/notifications/preferences/reset', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; refresh: string }>> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      return { error: 'No refresh token available' };
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
        // Refresh failed, clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        return { error: 'Token refresh failed' };
      }

      const data = await response.json();
      
      // Store new tokens
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      return { data: { token: data.access_token, refresh: data.refresh_token } };
    } catch (error) {
      return { error: 'Token refresh failed' };
    }
  }
}

// Environment-based configuration
const getApiBaseUrl = (): string => {
  // Check for environment variables first (production)
  if (typeof window !== 'undefined') {
    // Browser environment
    const protocol = window.location.protocol;
    const host = window.location.host;
    
    // If we're on a production domain, use the same domain for API
    if (host !== 'localhost:5173' && host !== '127.0.0.1:5173') {
      return `${protocol}//${host}/api`;
    }
  }
  
  // Development environment
  return 'http://localhost:8000/api';
};

// Create API client instance with environment-aware base URL
const apiClient = new ApiClient(getApiBaseUrl());

// Export apiClient and api for backwards compatibility
export const api = apiClient;
export { apiClient };

// Export individual functions for convenience
export const {
  login,
  logout,
  getCurrentUser,
  register,
  getCourses,
  getCourse,
  applyForCourse,
  getMyApplications,
  getMyCourses,
  getApplication,
  updateApplication,
  getLectures,
  getLecture,
  createLecture,
  deleteLecture,
  fetchTeachers,
  updateCurrentUser,
  updateUserPreferences,
  changePassword,
  forgotPassword,
  uploadFile,
  fetchFlashcards,
  fetchCourseFlashcards,
  fetchQuizzes,
  fetchCourseQuizzes,
  fetchSummaries,
  fetchCourseSummaries,
  fetchLectures,
  fetchCourseLectures,
  uploadAvatar,
  deleteAccount,
} = apiClient;

export async function fetchUserStats(userId: number) {
  return apiClient.request(`/user/${userId}/stats/`);
}

export async function updateUserStats(userId: number) {
  return apiClient.request(`/user/${userId}/stats/`, {
    method: 'PUT',
  });
}

export async function fetchWeeklyLearningHours(userId: number) {
  return apiClient.request(`/user/${userId}/weekly-learning-hours/`);
}

// Export types
export interface Lecture {
  id: number;
  title: string;
  description: string;
  course_id: number;
  instructor_id: number;
  created_at: string;
  updated_at: string;
  video_url?: string;
  videoUrl?: string; // Legacy support
  duration?: number;
  is_live?: boolean;
  scheduled_at?: string;
  status?: string;
  instructor?: string;
  date?: string;
  viewer_count?: number;
  // Legacy property aliases
  createdAt?: string; // Alias for created_at
  isLive?: boolean; // Alias for is_live
  viewerCount?: number; // Alias for viewer_count
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id?: number;
  created_at: string;
  updated_at: string;
  is_enrollment_open: boolean;
  credits: number;
  cloudfront_url?: string;
  course_name?: string; // Legacy support
  course_description?: string; // Legacy support
  teacher_id?: number; // Legacy support
  cloudfront_signed_url?: string;
  display_url?: string;
}

export interface Application {
  id: number;
  student_id: number;
  course_id: number;
  student_year: number;
  gpa: number;
  motivation_statement: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  student?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  course?: {
    id: number;
    title: string;
    description: string;
  };
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  read: boolean;
  created_at: string;
  updated_at: string;
  related_course_id?: number;
  related_application_id?: number;
}

export interface EnrolledCourse {
  id: number;
  title: string;
  description?: string;
  instructor_id: number;
  is_enrollment_open: boolean;
  credits: number;
  created_at: string;
  updated_at: string;
  enrolled_at: string;
  enrollment_status: string;
  instructor?: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    is_active: boolean;
  };
}

export interface Transcription {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
}