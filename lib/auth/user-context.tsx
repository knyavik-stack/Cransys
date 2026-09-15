'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserTier, getTierConfig, isFeatureAllowed, TierDefinition } from '@/lib/billing/tiers';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role?: 'ADMIN' | 'TESTER_ADMIN' | 'USER';
  tier: UserTier;
  hasPaid: boolean;
  reportsUsed: number;
  reportsLimit: number;
  isBlocked?: boolean;
  createdAt?: string;
  agencyName?: string;
  agencyContact?: string;
  agencyWebsite?: string;
  customNotes?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  tierConfig: TierDefinition;
  login: (email: string, name?: string) => void;
  loginWithCredentials: (email: string, password?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  registerWithCredentials: (email: string, password?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginTestAccount: (tier?: UserTier) => void;
  setTier: (tier: UserTier, makePaid?: boolean) => void;
  markPaid: (tier: UserTier) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  incrementReportsUsed: () => boolean;
  canCreateAudit: () => boolean;
  isAllowed: (feature: 'directApi' | 'aiInsights' | 'searchClustering' | 'rsyaBlacklist' | 'whiteLabel' | 'corpAutomation') => boolean;
  isTester: boolean;
  isAdmin: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  tierConfig: getTierConfig('PRO'),
  login: () => {},
  loginWithCredentials: async () => ({ success: true }),
  registerWithCredentials: async () => ({ success: true }),
  loginTestAccount: () => {},
  setTier: () => {},
  markPaid: () => {},
  updateProfile: () => {},
  incrementReportsUsed: () => true,
  canCreateAudit: () => true,
  isAllowed: () => false,
  isTester: false,
  isAdmin: false,
  logout: () => {},
});

const STORAGE_KEY = 'cransys_current_user_v5';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed.tier === 'EXPRESS') {
        parsed.tier = 'EXPRESS_PACK';
      }
      if (typeof parsed.reportsUsed !== 'number') {
        parsed.reportsUsed = 0;
      }
      if (parsed.hasPaid === undefined) {
        parsed.hasPaid = parsed.role === 'TESTER_ADMIN' || parsed.role === 'ADMIN';
      }
      const config = getTierConfig(parsed.tier);
      parsed.reportsLimit = config.reportsLimit;
      return parsed;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = (email: string, name?: string) => {
    const defaultTier: UserTier = 'EXPRESS_SINGLE';
    const config = getTierConfig(defaultTier);
    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      name: name || email.split('@')[0] || 'Пользователь',
      role: 'USER',
      tier: defaultTier,
      hasPaid: false,
      reportsUsed: 0,
      reportsLimit: config.reportsLimit,
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
  };

  const loginWithCredentials = async (
    email: string,
    password?: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Ошибка входа' };
      }

      const loggedUser: UserProfile = data.user;
      setUser(loggedUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
      } catch {}
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: 'Сетевая ошибка при подключении к серверу' };
    }
  };

  const registerWithCredentials = async (
    email: string,
    password?: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Ошибка при регистрации' };
      }

      const registeredUser: UserProfile = data.user;
      setUser(registeredUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredUser));
      } catch {}
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: 'Сетевая ошибка при регистрации' };
    }
  };

  const loginTestAccount = (tier: UserTier = 'MAX') => {
    const config = getTierConfig(tier);
    const testUser: UserProfile = {
      id: 'test_owner_account',
      email: 'test-owner@cransys-audit.ru',
      name: 'Тестовый аккаунт (Собственник)',
      role: 'TESTER_ADMIN',
      tier: tier,
      hasPaid: true,
      reportsUsed: 2,
      reportsLimit: config.reportsLimit,
      agencyName: 'Digital Direct Agency',
      agencyContact: '@direct_expert / +7 (999) 000-00-00',
      agencyWebsite: 'https://agency-direct.ru',
      customNotes: 'Аудит проведен ведущим контекстологом агентства. Обнаружен критический перекос в РСЯ.',
      createdAt: new Date().toISOString(),
    };
    setUser(testUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testUser));
    } catch {}
  };

  const setTier = (tier: UserTier, makePaid?: boolean) => {
    const config = getTierConfig(tier);
    if (!user) {
      const guestUser: UserProfile = {
        id: 'guest_account',
        email: 'guest@cransys.ru',
        name: 'Гость',
        role: 'USER',
        tier: tier,
        hasPaid: makePaid ?? false,
        reportsUsed: 0,
        reportsLimit: config.reportsLimit,
        createdAt: new Date().toISOString(),
      };
      setUser(guestUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(guestUser));
      } catch {}
      return;
    }

    const isTesterAccount = user.role === 'TESTER_ADMIN' || user.email === 'test-owner@cransys-audit.ru';
    const updated: UserProfile = {
      ...user,
      tier,
      hasPaid: isTesterAccount ? true : (makePaid ?? user.hasPaid),
      reportsLimit: config.reportsLimit,
    };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const markPaid = (tier: UserTier) => {
    const config = getTierConfig(tier);
    if (!user) {
      setTier(tier, true);
      return;
    }
    const updated: UserProfile = {
      ...user,
      tier,
      hasPaid: true,
      reportsLimit: config.reportsLimit,
    };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const incrementReportsUsed = (): boolean => {
    if (!user) return true;
    if (user.role === 'TESTER_ADMIN') {
      const updated = { ...user, reportsUsed: user.reportsUsed + 1 };
      setUser(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return true;
    }

    if (user.reportsUsed >= user.reportsLimit) {
      return false;
    }
    const updated = { ...user, reportsUsed: user.reportsUsed + 1 };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return true;
  };

  const canCreateAudit = (): boolean => {
    if (!user) return true;
    if (user.role === 'TESTER_ADMIN' || user.role === 'ADMIN') return true;
    return user.reportsUsed < user.reportsLimit;
  };

  const isAllowed = (feature: 'directApi' | 'aiInsights' | 'searchClustering' | 'rsyaBlacklist' | 'whiteLabel' | 'corpAutomation'): boolean => {
    if (!user) return false;
    // Если пользователь не оплатил и не тестер/админ, фичи заблокированы
    if (!user.hasPaid && user.role !== 'TESTER_ADMIN' && user.role !== 'ADMIN') {
      return false;
    }
    return isFeatureAllowed(user.tier, feature);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const isTester = user?.role === 'TESTER_ADMIN' || user?.email === 'test-owner@cransys-audit.ru';
  const isAdmin = user?.role === 'ADMIN';
  const currentTierConfig = getTierConfig(user?.tier);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        tierConfig: currentTierConfig,
        login,
        loginWithCredentials,
        registerWithCredentials,
        loginTestAccount,
        setTier,
        markPaid,
        updateProfile,
        incrementReportsUsed,
        canCreateAudit,
        isAllowed,
        isTester,
        isAdmin,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
