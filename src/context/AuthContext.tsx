import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { AuthResponse, User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<AuthResponse>;
  register: (data: {
    name: string;
    phone: string;
    password: string;
    age?: number;
    bio?: string;
    interests?: string[];
    location?: string;
    socialLinks?: { instagram?: string; twitter?: string; linkedin?: string };
    avatar?: string;
  }) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  switchDemoUser: (phone: string) => Promise<boolean>;
  quickLogin: (phone: string, password?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('planmate_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        localStorage.removeItem('planmate_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem('planmate_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (phone: string, password: string): Promise<AuthResponse> => {
    const res = await api.login(phone, password);

    if (res.success && res.token && res.user) {
      localStorage.setItem('planmate_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }

    return res;
  };

  const register = async (data: {
    name: string;
    phone: string;
    password: string;
    age?: number;
    bio?: string;
    interests?: string[];
    location?: string;
    socialLinks?: { instagram?: string; twitter?: string; linkedin?: string };
    avatar?: string;
  }): Promise<AuthResponse> => {
    const res = await api.register(data);
    if (res.success && res.token && res.user) {
      localStorage.setItem('planmate_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('planmate_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  // Helper for quick demo testing between users.
  // Login is now direct; no OTP is required.
  const switchDemoUser = async (phone: string): Promise<boolean> => {
    try {
      const res = await api.login(phone, 'password123');

      if (res.success && res.token && res.user) {
        localStorage.setItem('planmate_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return true;
      }
    } catch (e) {
      console.error('Failed to switch demo user', e);
    }

    return false;
  };

  const quickLogin = async (phone: string, password = 'password123'): Promise<boolean> => {
    return switchDemoUser(phone);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        switchDemoUser,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
