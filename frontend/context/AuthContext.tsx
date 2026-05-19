'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { getChatSessionId, rotateChatSession, clearGuestSessions } from '@/lib/chatSession';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncSession = async () => {
      const storedUser = localStorage.getItem('userInfo');
      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get('/api/auth/me');
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
      } catch {
        localStorage.removeItem('userInfo');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    syncSession();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
    getChatSessionId(userData._id);
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    }
    setUser(null);
    localStorage.removeItem('userInfo');
    clearGuestSessions();
    rotateChatSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
