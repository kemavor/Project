import { apiClient } from './api';

export interface OAuthProvider {
  name: 'google' | 'github' | 'microsoft';
  displayName: string;
  icon: string;
  color: string;
}

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
}

export interface OAuthConfig {
  google: {
    clientId: string;
    scope: string;
  };
  github: {
    clientId: string;
    scope: string;
  };
  microsoft: {
    clientId: string;
    scope: string;
  };
}

// OAuth configuration
const OAUTH_CONFIG: OAuthConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    scope: 'email profile',
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
    scope: 'user:email',
  },
  microsoft: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    scope: 'User.Read',
  },
};

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    name: 'google',
    displayName: 'Google',
    icon: '🔍',
    color: '#4285F4',
  },
  {
    name: 'github',
    displayName: 'GitHub',
    icon: '🐙',
    color: '#333',
  },
  {
    name: 'microsoft',
    displayName: 'Microsoft',
    icon: '🪟',
    color: '#00A4EF',
  },
];

class OAuthService {
  private redirectUri: string;

  constructor() {
    this.redirectUri = `${window.location.origin}/oauth/callback`;
  }

  /**
   * Initiate OAuth login for a specific user role
   */
  public async initiateOAuthLogin(provider: string, role: 'student' | 'teacher' | 'admin'): Promise<void> {
    const config = OAUTH_CONFIG[provider as keyof OAuthConfig];
    
    if (!config?.clientId) {
      throw new Error(`${provider} OAuth is not configured`);
    }

    // Store the intended role for after OAuth callback
    sessionStorage.setItem('oauth_role', role);
    sessionStorage.setItem('oauth_provider', provider);

    const authUrl = this.buildAuthUrl(provider, config);
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback and complete authentication
   */
  public async handleOAuthCallback(code: string, state?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = sessionStorage.getItem('oauth_provider');
      const role = sessionStorage.getItem('oauth_role') as 'student' | 'teacher' | 'admin';

      if (!provider || !role) {
        throw new Error('OAuth session data not found');
      }

      // Exchange code for token with backend
      const response = await apiClient.oauthCallback({
        provider,
        code,
        state,
        role,
        redirect_uri: this.redirectUri,
      });

      if (response.data) {
        // Clear session storage
        sessionStorage.removeItem('oauth_role');
        sessionStorage.removeItem('oauth_provider');

        return { success: true };
      } else {
        return { success: false, error: 'OAuth authentication failed' };
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      return { success: false, error: 'OAuth authentication failed' };
    }
  }

  /**
   * Build OAuth authorization URL
   */
  private buildAuthUrl(provider: string, config: any): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: this.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: this.generateState(),
    });

    const baseUrls = {
      google: 'https://accounts.google.com/oauth/authorize',
      github: 'https://github.com/login/oauth/authorize',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    };

    return `${baseUrls[provider as keyof typeof baseUrls]}?${params.toString()}`;
  }

  /**
   * Generate a random state parameter for OAuth security
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if OAuth is configured for a provider
   */
  public isProviderConfigured(provider: string): boolean {
    const config = OAUTH_CONFIG[provider as keyof OAuthConfig];
    return !!(config?.clientId);
  }

  /**
   * Get available OAuth providers for a specific role
   */
  public getAvailableProviders(role: 'student' | 'teacher' | 'admin'): OAuthProvider[] {
    // Filter providers based on role requirements
    const roleConfig = {
      student: ['google', 'github'], // Students can use Google or GitHub
      teacher: ['google', 'microsoft'], // Teachers can use Google or Microsoft
      admin: ['google', 'microsoft'], // Admins can use Google or Microsoft
    };

    const allowedProviders = roleConfig[role] || [];
    
    return OAUTH_PROVIDERS.filter(provider => 
      allowedProviders.includes(provider.name) && 
      this.isProviderConfigured(provider.name)
    );
  }

  /**
   * Validate OAuth token and get user info
   */
  public async validateToken(token: string): Promise<OAuthUser | null> {
    try {
      const response = await apiClient.validateOAuthToken(token);
      return response.data || null;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Link existing account with OAuth provider
   */
  public async linkAccount(provider: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.linkOAuthAccount({
        provider,
        code,
        redirect_uri: this.redirectUri,
      });

      return {
        success: !!response.data,
        error: response.data ? undefined : 'Failed to link account',
      };
    } catch (error: any) {
      return { success: false, error: 'Failed to link account' };
    }
  }

  /**
   * Unlink OAuth account
   */
  public async unlinkAccount(provider: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.unlinkOAuthAccount(provider);
      return {
        success: !!response.data,
        error: response.data ? undefined : 'Failed to unlink account',
      };
    } catch (error: any) {
      return { success: false, error: 'Failed to unlink account' };
    }
  }
}

export const oauthService = new OAuthService(); 