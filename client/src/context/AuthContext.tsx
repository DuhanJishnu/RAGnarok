"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, logout as logoutService } from '@/service/auth';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>({
  id: "123dfrrfr",
  username: "Shashank",
  email: "uamrshashank@gmail.com",
}); //testing
  const [isAuthenticated, setIsAuthenticated] = useState(true);//testing
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getMe()
      .then(userData => {
        setUser(userData);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = () => {
    getMe().then(userData => {
      setUser(userData);
      setIsAuthenticated(true);
      router.push('/');
    });
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
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
