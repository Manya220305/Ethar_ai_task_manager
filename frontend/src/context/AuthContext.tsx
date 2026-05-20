import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: 'Admin' | 'Member') => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await apiFetch<{ user: User }>('/api/auth/me');
          setUser(res.user);
        } catch (error) {
          console.error('Failed to restore auth session:', error);
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const signup = async (name: string, email: string, password: string, role: 'Admin' | 'Member') => {
    try {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
