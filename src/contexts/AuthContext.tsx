import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, User } from '../lib/api';
import { wsService } from '../lib/websocket';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (preferences: any) => Promise<{ success: boolean; error?: string }>;
  changePassword: (passwordData: { old_password: string; new_password: string }) => Promise<{ success: boolean; error?: string }>;
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

  useEffect(() => {
    // Check for existing auth token on app start
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        // Set auth token for WebSocket service
        wsService.setAuthToken(token);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Clear invalid data
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        wsService.clearAuth();
      }
    } else {
      wsService.clearAuth();
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, role?: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login({ username, password, role });
      
      if (response.data) {
        const { user: userData, token, refresh } = response.data;
        setUser(userData);
        setIsAuthenticated(true);
        
        // Store auth data
        localStorage.setItem('access_token', token || '');
        localStorage.setItem('refresh_token', refresh || '');
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Set auth token for WebSocket service
        wsService.setAuthToken(token || '');
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await apiClient.register(userData);
      
      if (response.data) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
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
    wsService.clearAuth();
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

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    hasRole,
    hasPermission,
    updateUser,
    updatePreferences,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};