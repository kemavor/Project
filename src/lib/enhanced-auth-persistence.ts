/**
 * Enhanced Authentication Persistence Strategy
 * Provides more robust token storage and recovery mechanisms
 */

interface AuthPersistenceConfig {
  tokenRefreshThreshold: number; // seconds before expiry to refresh
  maxRefreshRetries: number;
  refreshRetryDelay: number; // milliseconds
  enableSecureStorage: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  lastActivity: number;
  sessionId: string;
}

export class EnhancedAuthPersistence {
  private config: AuthPersistenceConfig;
  private refreshAttempts: number = 0;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: Partial<AuthPersistenceConfig> = {}) {
    this.config = {
      tokenRefreshThreshold: 300, // 5 minutes
      maxRefreshRetries: 3,
      refreshRetryDelay: 1000, // 1 second
      enableSecureStorage: false,
      ...config
    };
  }

  /**
   * Initialize authentication from stored state
   */
  async initializeAuth(): Promise<AuthState | null> {
    console.log('🔄 Initializing enhanced auth persistence...');
    
    try {
      const authState = this.getStoredAuthState();
      
      if (!authState.accessToken || !authState.refreshToken) {
        console.log('❌ No stored authentication found');
        return null;
      }

      // Check if token needs refresh
      if (this.shouldRefreshToken(authState.accessToken)) {
        console.log('🔄 Token needs refresh, attempting...');
        
        const refreshed = await this.attemptTokenRefresh();
        if (refreshed) {
          return this.getStoredAuthState();
        } else {
          console.log('❌ Token refresh failed during initialization');
          this.clearAuthState();
          return null;
        }
      }

      console.log('✅ Valid authentication state found');
      this.updateLastActivity();
      return authState;

    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      this.clearAuthState();
      return null;
    }
  }

  /**
   * Store authentication state with enhanced metadata
   */
  storeAuthState(accessToken: string, refreshToken: string, user: any): void {
    const authState: AuthState = {
      accessToken,
      refreshToken,
      user,
      lastActivity: Date.now(),
      sessionId: this.generateSessionId()
    };

    try {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('auth_metadata', JSON.stringify({
        lastActivity: authState.lastActivity,
        sessionId: authState.sessionId,
        version: '2.0'
      }));

      console.log('✅ Enhanced auth state stored');
    } catch (error) {
      console.error('❌ Failed to store auth state:', error);
    }
  }

  /**
   * Get stored authentication state with validation
   */
  getStoredAuthState(): AuthState {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const userStr = localStorage.getItem('user');
      const metadataStr = localStorage.getItem('auth_metadata');

      const user = userStr ? JSON.parse(userStr) : null;
      const metadata = metadataStr ? JSON.parse(metadataStr) : {};

      return {
        accessToken,
        refreshToken,
        user,
        lastActivity: metadata.lastActivity || 0,
        sessionId: metadata.sessionId || ''
      };
    } catch (error) {
      console.error('❌ Failed to parse auth state:', error);
      return {
        accessToken: null,
        refreshToken: null,
        user: null,
        lastActivity: 0,
        sessionId: ''
      };
    }
  }

  /**
   * Check if token should be refreshed
   */
  shouldRefreshToken(accessToken: string): boolean {
    if (!accessToken) return false;

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;

      return timeUntilExpiry < this.config.tokenRefreshThreshold;
    } catch (error) {
      console.error('❌ Failed to parse token:', error);
      return true; // Assume needs refresh if can't parse
    }
  }

  /**
   * Attempt token refresh with retry logic
   */
  async attemptTokenRefresh(): Promise<boolean> {
    // Prevent multiple concurrent refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      console.log('🔄 Using existing refresh promise...');
      return await this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh with retries
   */
  private async performTokenRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.error('❌ No refresh token available');
      return false;
    }

    for (let attempt = 1; attempt <= this.config.maxRefreshRetries; attempt++) {
      try {
        console.log(`🔄 Token refresh attempt ${attempt}/${this.config.maxRefreshRetries}`);

        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.token && data.refresh) {
            localStorage.setItem('access_token', data.token);
            localStorage.setItem('refresh_token', data.refresh);
            this.updateLastActivity();
            
            console.log('✅ Token refreshed successfully');
            this.refreshAttempts = 0;
            return true;
          }
        }

        console.warn(`⚠️ Refresh attempt ${attempt} failed:`, response.status);

        // Wait before retry (except on last attempt)
        if (attempt < this.config.maxRefreshRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.refreshRetryDelay));
        }

      } catch (error) {
        console.error(`❌ Refresh attempt ${attempt} error:`, error);
      }
    }

    console.error('❌ All refresh attempts failed');
    this.refreshAttempts = this.config.maxRefreshRetries;
    return false;
  }

  /**
   * Clear authentication state with cleanup
   */
  clearAuthState(): void {
    console.log('🧹 Clearing enhanced auth state...');
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_metadata');
    
    this.refreshAttempts = 0;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    const metadata = localStorage.getItem('auth_metadata');
    if (metadata) {
      try {
        const data = JSON.parse(metadata);
        data.lastActivity = Date.now();
        localStorage.setItem('auth_metadata', JSON.stringify(data));
      } catch (error) {
        console.error('❌ Failed to update last activity:', error);
      }
    }
  }

  /**
   * Check if session is still valid based on activity
   */
  isSessionValid(maxInactiveTime: number = 24 * 60 * 60 * 1000): boolean {
    const authState = this.getStoredAuthState();
    if (!authState.lastActivity) return false;
    
    const inactiveTime = Date.now() - authState.lastActivity;
    return inactiveTime < maxInactiveTime;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get authentication statistics for debugging
   */
  getDebugInfo() {
    const authState = this.getStoredAuthState();
    const hasTokens = !!(authState.accessToken && authState.refreshToken);
    
    return {
      hasTokens,
      refreshAttempts: this.refreshAttempts,
      isRefreshing: this.isRefreshing,
      sessionValid: this.isSessionValid(),
      lastActivity: authState.lastActivity ? new Date(authState.lastActivity).toLocaleString() : 'Never',
      sessionId: authState.sessionId,
      tokenShouldRefresh: authState.accessToken ? this.shouldRefreshToken(authState.accessToken) : false
    };
  }
}

// Create global instance
export const authPersistence = new EnhancedAuthPersistence({
  tokenRefreshThreshold: 300, // 5 minutes
  maxRefreshRetries: 3,
  refreshRetryDelay: 2000, // 2 seconds
  enableSecureStorage: false
});

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).authPersistence = authPersistence;
}