/**
 * Authentication Token Monitor
 * Helps track when and why tokens disappear
 */

class AuthMonitor {
  private interval: NodeJS.Timeout | null = null;
  private lastState = {
    accessToken: '',
    refreshToken: '',
    userData: ''
  };

  start() {
    if (this.interval) return;
    
    console.log('🔍 Starting auth token monitor...');
    
    // Check every 5 seconds
    this.interval = setInterval(() => {
      this.checkTokenState();
    }, 5000);

    // Initial check
    this.checkTokenState();

    // Listen for storage events (tokens changed by other tabs)
    window.addEventListener('storage', this.handleStorageChange.bind(this));

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    console.log('🔍 Stopped auth token monitor');
  }

  private checkTokenState() {
    const currentState = {
      accessToken: localStorage.getItem('access_token') || '',
      refreshToken: localStorage.getItem('refresh_token') || '',
      userData: localStorage.getItem('user') || ''
    };

    // Check for changes
    if (JSON.stringify(currentState) !== JSON.stringify(this.lastState)) {
      this.logStateChange(this.lastState, currentState);
      this.lastState = currentState;
    }
  }

  private logStateChange(oldState: any, newState: any) {
    console.group('🔄 Auth State Changed');
    console.log('Time:', new Date().toLocaleTimeString());
    
    // Check access token changes
    if (oldState.accessToken !== newState.accessToken) {
      if (!oldState.accessToken && newState.accessToken) {
        console.log('✅ Access token ADDED');
      } else if (oldState.accessToken && !newState.accessToken) {
        console.warn('❌ Access token REMOVED');
        console.trace('Token removal stack trace:');
      } else if (oldState.accessToken !== newState.accessToken) {
        console.log('🔄 Access token CHANGED');
      }
    }

    // Check refresh token changes
    if (oldState.refreshToken !== newState.refreshToken) {
      if (!oldState.refreshToken && newState.refreshToken) {
        console.log('✅ Refresh token ADDED');
      } else if (oldState.refreshToken && !newState.refreshToken) {
        console.warn('❌ Refresh token REMOVED');
      } else {
        console.log('🔄 Refresh token CHANGED');
      }
    }

    // Check user data changes
    if (oldState.userData !== newState.userData) {
      if (!oldState.userData && newState.userData) {
        console.log('✅ User data ADDED');
      } else if (oldState.userData && !newState.userData) {
        console.warn('❌ User data REMOVED');
      } else {
        console.log('🔄 User data CHANGED');
      }
    }

    console.groupEnd();
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key?.includes('token') || event.key === 'user') {
      console.log('🔄 Storage event detected:', event.key, 'changed to:', event.newValue ? 'present' : 'null');
      this.checkTokenState();
    }
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      console.log('👁️ Page became visible, checking auth state...');
      this.checkTokenState();
    }
  }

  // Manual check method
  public checkNow() {
    this.checkTokenState();
  }

  // Get current state summary
  public getState() {
    return {
      hasAccessToken: !!localStorage.getItem('access_token'),
      hasRefreshToken: !!localStorage.getItem('refresh_token'),
      hasUserData: !!localStorage.getItem('user'),
      timestamp: new Date().toISOString()
    };
  }
}

// Create global instance
const authMonitor = new AuthMonitor();

// Export for use in components
export default authMonitor;

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).authMonitor = authMonitor;
  
  // Auto-start in development
  if (process.env.NODE_ENV === 'development') {
    authMonitor.start();
  }
}