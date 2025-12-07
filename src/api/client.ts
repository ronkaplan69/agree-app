import { API_URL, API_CONFIG } from './config';
import { storage } from '../services/storage';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean; // Whether to include auth token (default: true)
};

type ApiResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  message?: string;
};

class ApiClient {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await storage.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async refreshTokens(): Promise<boolean> {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await storage.clearAll();
        return false;
      }

      const result = await response.json();
      await storage.setTokens(
        result.data.accessToken,
        result.data.refreshToken
      );
      return true;
    } catch {
      await storage.clearAll();
      return false;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, auth = true } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (auth) {
      const authHeader = await this.getAuthHeader();
      Object.assign(requestHeaders, authHeader);
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    config.signal = controller.signal;

    try {
      let response = await fetch(`${API_URL}${endpoint}`, config);

      // If 401 and we have auth, try to refresh token
      if (response.status === 401 && auth) {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          // Retry with new token
          const newAuthHeader = await this.getAuthHeader();
          Object.assign(requestHeaders, newAuthHeader);
          config.headers = requestHeaders;
          response = await fetch(`${API_URL}${endpoint}`, config);
        }
      }

      const result = await response.json();

      if (!response.ok) {
        return {
          status: 'error',
          message: result.message || `Request failed with status ${response.status}`,
        };
      }

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { status: 'error', message: 'Request timeout' };
      }
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Convenience methods
  get<T>(endpoint: string, auth = true) {
    return this.request<T>(endpoint, { method: 'GET', auth });
  }

  post<T>(endpoint: string, body?: unknown, auth = true) {
    return this.request<T>(endpoint, { method: 'POST', body, auth });
  }

  put<T>(endpoint: string, body?: unknown, auth = true) {
    return this.request<T>(endpoint, { method: 'PUT', body, auth });
  }

  delete<T>(endpoint: string, auth = true) {
    return this.request<T>(endpoint, { method: 'DELETE', auth });
  }
}

export const api = new ApiClient();

