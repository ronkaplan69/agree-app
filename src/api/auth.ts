import { api } from './client';
import { storage } from '../services/storage';

// Types
export type User = {
  id: string;
  email: string;
  name?: string;
  birthYear?: number;
  country?: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
};

type RequestCodeResponse = {
  email: string;
  isNewUser?: boolean;
  bypass?: boolean;
};

type VerifyCodeResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

type MeResponse = {
  user: User;
};

// Auth API
export const authApi = {
  /**
   * Request verification code for registration (new user)
   */
  async requestCode(
    email: string,
    name: string,
    birthYear: number,
    countryCode: string,
  ) {
    return api.post<RequestCodeResponse>(
      '/auth/request-code',
      { email, name, birthYear, countryCode },
      false, // No auth required
    );
  },

  /**
   * Request verification code for login (existing user)
   */
  async login(email: string) {
    return api.post<RequestCodeResponse>(
      '/auth/login',
      { email },
      false, // No auth required
    );
  },

  /**
   * Verify code and get tokens
   */
  async verifyCode(email: string, code: string) {
    const result = await api.post<VerifyCodeResponse>(
      '/auth/verify-code',
      { email, code },
      false, // No auth required
    );

    // Store tokens and user if successful
    if (result.status === 'success' && result.data) {
      await storage.setTokens(
        result.data.accessToken,
        result.data.refreshToken,
      );
      await storage.setUser(result.data.user);
    }

    return result;
  },

  /**
   * Refresh access token
   */
  async refresh() {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      return { status: 'error' as const, message: 'No refresh token' };
    }

    const result = await api.post<RefreshResponse>(
      '/auth/refresh',
      { refreshToken },
      false,
    );

    if (result.status === 'success' && result.data) {
      await storage.setTokens(
        result.data.accessToken,
        result.data.refreshToken,
      );
    }

    return result;
  },

  /**
   * Get current user
   */
  async getMe() {
    const result = await api.get<MeResponse>('/auth/me');

    if (result.status === 'success' && result.data) {
      await storage.setUser(result.data.user);
    }

    return result;
  },

  /**
   * Logout
   */
  async logout() {
    await api.post('/auth/logout');
    await storage.clearAll();
  },

  /**
   * Check if user is logged in (has valid tokens)
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await storage.getAccessToken();
    return !!token;
  },

  /**
   * Get stored user (without API call)
   */
  async getStoredUser(): Promise<User | null> {
    return storage.getUser<User>();
  },
};
