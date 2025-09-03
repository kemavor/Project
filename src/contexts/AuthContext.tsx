import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, User } from '../lib/api';
import { wsService } from '../lib/websocket';
import { toast } from 'react-hot-toast';

// Enhanced authentication error types
interface AuthError {
  message: string;
  errors?: string[];
  type?: string;
  field?: string;
  remaining_attempts?: number;
  locked_until?: string;
}

// Enhanced authentication responses
interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  errors?: string[];
  type?: string;
  data?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: AuthError | null;
  login: (username: string, password: string, role?: string) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (preferences: any) => Promise<AuthResponse>;
  changePassword: (passwordData: { old_password: string; new_password: string }) => Promise<AuthResponse>;
  clearError: () => void;
  isTokenExpired: () => boolean;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAndRefreshToken = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - currentTime;

        // Refresh token if it expires within the next 5 minutes
        if (timeUntilExpiry < 300) {
          const success = await refreshToken();
          if (!success) {
            logout();
            toast.error('Your session has expired. Please log in again.');
          }
        }
      } catch (error) {
        console.error('Token check failed:', error);
      }
    };

    // Check token every 5 minutes
    const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing auth token on app start
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          
          // Check if token is expired
          if (isTokenExpired()) {
            // Try to refresh the token
            console.log('Token expired, attempting refresh...');
            const success = await refreshToken();
            if (success) {
              console.log('Token refreshed successfully');
              setUser(userData);
              setIsAuthenticated(true);
              wsService.setAuthToken(localStorage.getItem('access_token') || '');
            } else {
              console.log('Token refresh failed, clearing auth');
              // Refresh failed, clear auth
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              wsService.clearAuthToken();
              toast.error('Your session has expired. Please log in again.');
            }
          } else {
            console.log('Token valid, setting auth state');
            setUser(userData);
            setIsAuthenticated(true);
            wsService.setAuthToken(token);
          }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          // Clear invalid data
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          wsService.clearAuthToken();
        }
      } else {
        wsService.clearAuthToken();
      }
      
      // Only set loading to false after all async operations complete
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const clearError = () => {
    setAuthError(null);
  };

  const login = async (username: string, password: string, role?: string): Promise<AuthResponse> => {
    try {
      clearError();
      setIsLoading(true);
      
      const response = await apiClient.login({ username, password, role });
      
      if (response.data) {
        const { user: userData, token, refresh } = response.data;
        console.log('🔐 Login successful, setting auth state:', { username: userData.username, token: token?.substring(0, 20) });
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Store auth data
        localStorage.setItem('access_token', token || '');
        localStorage.setItem('refresh_token', refresh || '');
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('💾 Auth data stored in localStorage');
        
        // Set auth token for WebSocket service
        wsService.setAuthToken(token || '');
        
        // Small delay to ensure token propagation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Show success message
        toast.success(response.data.message || `Welcome back, ${userData.first_name || userData.username}!`);
        
        console.log('✅ Login process completed successfully');
        
        return { 
          success: true, 
          message: response.data.message,
          data: userData 
        };
      } else {
        // Handle API error response
        const errorDetails = response.error;
        let authError: AuthError;
        
        if (typeof errorDetails === 'object' && errorDetails !== null && errorDetails !== undefined) {
          const errorObj = errorDetails as any;
          authError = {
            message: errorObj.message || 'Login failed',
            errors: errorObj.errors || [],
            type: errorObj.type,
            remaining_attempts: errorObj.remaining_attempts,
            locked_until: errorObj.locked_until
          };
        } else {
          authError = {
            message: typeof errorDetails === 'string' ? errorDetails : 'Login failed',
            errors: [typeof errorDetails === 'string' ? errorDetails : 'Please check your credentials and try again']
          };
        }
        
        setAuthError(authError);
        
        // Show appropriate error toast
        if (authError.type === 'account_locked') {
          toast.error(authError.message);
        } else if (authError.type === 'authentication_failed') {
          toast.error(`${authError.message}${authError.remaining_attempts ? ` (${authError.remaining_attempts} attempts remaining)` : ''}`);
        } else {
          toast.error(authError.message);
        }
        
        return { 
          success: false, 
          error: authError.message,
          errors: authError.errors,
          type: authError.type
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      
      setAuthError({
        message: errorMessage,
        type: 'network_error'
      });
      
      toast.error(errorMessage);
      
      return { success: false, error: errorMessage, type: 'network_error' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<AuthResponse> => {
    try {
      clearError();
      setIsLoading(true);
      
      const response = await apiClient.register(userData);
      
      if (response.data) {
        // Show success message
        toast.success(response.data.message || 'Account created successfully! Please check your email to verify your account.');
        
        return { 
          success: true, 
          message: response.data.message,
          data: response.data 
        };
      } else {
        // Handle API error response
        const errorDetails = response.error;
        let authError: AuthError;
        
        if (typeof errorDetails === 'object' && errorDetails !== null && errorDetails !== undefined) {
          const errorObj = errorDetails as any;
          authError = {
            message: errorObj.message || 'Registration failed',
            errors: errorObj.errors || [],
            type: errorObj.type,
            field: errorObj.field
          };
        } else {
          authError = {
            message: typeof errorDetails === 'string' ? errorDetails : 'Registration failed',
            errors: [typeof errorDetails === 'string' ? errorDetails : 'Please check your information and try again']
          };
        }
        
        setAuthError(authError);
        
        // Show appropriate error toast
        if (authError.type === 'validation_error') {
          toast.error('Please correct the highlighted fields');
        } else if (authError.type === 'username_exists') {
          toast.error('This username is already taken');
        } else if (authError.type === 'email_exists') {
          toast.error('An account with this email already exists');
        } else {
          toast.error(authError.message);
        }
        
        return { 
          success: false, 
          error: authError.message,
          errors: authError.errors,
          type: authError.type
        };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      
      setAuthError({
        message: errorMessage,
        type: 'network_error'
      });
      
      toast.error(errorMessage);
      
      return { success: false, error: errorMessage, type: 'network_error' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Clear WebSocket auth
    wsService.clearAuthToken();
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await apiClient.forgotPassword({ email });
      return { success: true };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'Failed to send reset email' };
    }
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role || user.is_staff || user.role === 'admin';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updatePreferences = async (preferences: any) => {
    try {
      setIsLoading(true);
      const response = await apiClient.updateUserPreferences(preferences);
      if (response.data) {
        updateUser({ preferences });
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to update preferences' };
      }
    } catch (error: any) {
      console.error('Update preferences error:', error);
      return { success: false, error: 'Failed to update preferences' };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (passwordData: { old_password: string; new_password: string }) => {
    try {
      setIsLoading(true);
      const response = await apiClient.changePassword(passwordData);
      if (response.data) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to change password' };
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    } finally {
      setIsLoading(false);
    }
  };

  const isTokenExpired = (): boolean => {
    const token = localStorage.getItem('access_token');
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      const response = await apiClient.refreshToken();
      
      if (response.data) {
        localStorage.setItem('access_token', response.data.token);
        
        // Update refresh token if provided (token rotation)
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
        
        // Note: refresh token response doesn't include user data
        // User data remains the same
        
        wsService.setAuthToken(response.data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout(); // Force logout on refresh failure
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    login,
    register,
    logout,
    forgotPassword,
    hasRole,
    hasPermission,
    updateUser,
    updatePreferences,
    changePassword,
    clearError,
    isTokenExpired,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};