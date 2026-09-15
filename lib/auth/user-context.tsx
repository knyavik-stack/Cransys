'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role?: string;
  tier: 'EXPRESS' | 'PRO' | 'MAX';
  createdAt?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, name?: string) => void;
  loginTestAccount: (tier?: 'EXPRESS' | 'PRO' | 'MAX') => void;
  setTier: (tier: 'EXPRESS' | 'PRO' | 'MAX') => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  loginTestAccount: () => {},
  setTier: () => {},
  logout: () => {},
});

const STORAGE_KEY = 'cransys_current_user_v3';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = (email: string, name?: string) => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      name: name || email.split('@')[0] || 'Пользователь',
      tier: 'PRO', // По умолчанию для авторизованных
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
  };

  const loginTestAccount = (tier: 'EXPRESS' | 'PRO' | 'MAX' = 'MAX') => {
    const testUser: UserProfile = {
      id: 'test_owner_account',
      email: 'test-owner@cransys-audit.ru',
      name: 'Тестовый аккаунт (Собственник)',
      role: 'TESTER_ADMIN',
      tier: tier,
      createdAt: new Date().toISOString(),
    };
    setUser(testUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testUser));
    } catch {}
  };

  const setTier = (tier: 'EXPRESS' | 'PRO' | 'MAX') => {
    if (!user) {
      // Если гость хочет переключить тариф для тестирования
      const guestUser: UserProfile = {
        id: 'guest_test_account',
        email: 'guest@cransys-test.ru',
        name: 'Тестовый гость',
        tier: tier,
        createdAt: new Date().toISOString(),
      };
      setUser(guestUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(guestUser));
      } catch {}
      return;
    }

    const updated = { ...user, tier };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, loginTestAccount, setTier, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

