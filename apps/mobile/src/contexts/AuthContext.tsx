import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, removeToken } from '../api/client';
import * as authApi from '../api/auth';
import type { RegisterData } from '../api/auth';

interface User {
  id: string;
  email: string;
  nickname: string;
  role: string;
  memberType: 'association' | 'partner' | 'user';
  parentId?: string;
  cashbackBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  associationName?: string;
  businessName?: string;
  businessCategory?: string;
}

interface SocialLoginData {
  provider: string;
  providerId: string;
  email: string;
  nickname: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  socialLogin: (data: SocialLoginData) => Promise<void>;
  ihomeLogin: (data: { mbId: string; email: string; nickname: string; ts: string; sig: string }) => Promise<void>;
  ihomePasswordLogin: (mbId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  socialLogin: async () => {},
  ihomeLogin: async () => {},
  ihomePasswordLogin: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const profile = await authApi.getProfile();
        setUser(profile);
      }
    } catch {
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
  };

  const register = async (data: RegisterData) => {
    const res = await authApi.register(data);
    setUser(res.user);
  };

  const handleSocialLogin = async (data: SocialLoginData) => {
    const res = await authApi.socialLogin(data);
    setUser(res.user);
  };

  const handleIhomeLogin = async (data: {
    mbId: string;
    email: string;
    nickname: string;
    ts: string;
    sig: string;
  }) => {
    const res = await authApi.ihomeLogin(data);
    setUser(res.user);
  };

  const handleIhomePasswordLogin = async (mbId: string, password: string) => {
    const res = await authApi.ihomePasswordLogin(mbId, password);
    setUser(res.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      await removeToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        socialLogin: handleSocialLogin,
        ihomeLogin: handleIhomeLogin,
        ihomePasswordLogin: handleIhomePasswordLogin,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
