import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api.ts';

export type Role = 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  organization?: {
    id: string;
    name: string;
    verified: boolean;
    logoUrl?: string;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, role: Role, organizationName?: string) => Promise<AuthUser>;
  logout: () => void;
  switchDemoUser: (role: 'ADMIN' | 'ORGANIZER' | 'ATTENDEE') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ticketnest_token'));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('ticketnest_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('ticketnest_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (name: string, email: string, password: string, role: Role, organizationName?: string) => {
    const res = await api.post('/auth/register', { name, email, password, role, organizationName });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('ticketnest_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('ticketnest_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoUser = async (role: 'ADMIN' | 'ORGANIZER' | 'ATTENDEE') => {
    setLoading(true);
    let email = 'attendee@example.com';
    let password = 'attendee123';

    if (role === 'ADMIN') {
      email = 'admin@ticketnest.io';
      password = 'admin123';
    } else if (role === 'ORGANIZER') {
      email = 'organizer@pulsefest.io';
      password = 'organizer123';
    }

    try {
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoUser,
        refreshUser: fetchProfile,
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
