import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, User } from '../api';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextType = AuthState & {
  requestCode: (
    email: string,
    name: string,
    birthYear: number,
    countryCode: string,
  ) => Promise<{ success: boolean; error?: string }>;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyCode: (
    email: string,
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isLoggedIn = await authApi.isLoggedIn();
        if (isLoggedIn) {
          const storedUser = await authApi.getStoredUser();
          if (storedUser) {
            setState({
              user: storedUser,
              isLoading: false,
              isAuthenticated: true,
            });
            return;
          }
        }
      } catch (error) {
        console.log('Auth check failed:', error);
      }

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    };

    checkAuth();
  }, []);

  const requestCode = async (
    email: string,
    name: string,
    birthYear: number,
    countryCode: string,
  ) => {
    const result = await authApi.requestCode(
      email,
      name,
      birthYear,
      countryCode,
    );
    if (result.status === 'success') {
      return { success: true };
    }
    return { success: false, error: result.message || 'Failed to send code' };
  };

  const login = async (email: string) => {
    const result = await authApi.login(email);
    if (result.status === 'success') {
      return { success: true };
    }
    return { success: false, error: result.message || 'Failed to send code' };
  };

  const verifyCode = async (email: string, code: string) => {
    const result = await authApi.verifyCode(email, code);
    if (result.status === 'success' && result.data) {
      setState({
        user: result.data.user,
        isLoading: false,
        isAuthenticated: true,
      });
      return { success: true };
    }
    return { success: false, error: result.message || 'Invalid code' };
  };

  const logout = async () => {
    await authApi.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const refreshUser = async () => {
    const result = await authApi.getMe();
    if (result.status === 'success' && result.data) {
      setState(prev => ({
        ...prev,
        user: result.data!.user,
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        requestCode,
        login,
        verifyCode,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
