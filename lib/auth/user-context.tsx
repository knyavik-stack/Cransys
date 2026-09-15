'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserTier, getTierConfig, isFeatureAllowed, TierDefinition } from '@/lib/billing/tiers';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role?: string;
  tier: UserTier;
  reportsUsed: number;
  reportsLimit: number;
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
  loginTestAccount: (tier?: UserTier) => void;
  setTier: (tier: UserTier) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  incrementReportsUsed: () => boolean;
  canCreateAudit: () => boolean;
  isAllowed: (feature: 'directApi' | 'aiInsights' | 'searchClustering' | 'rsyaBlacklist' | 'whiteLabel' | 'corpAutomation') => boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  tierConfig: getTierConfig('PRO'),
  login: () => {},
  loginTestAccount: () => {},
  setTier: () => {},
  updateProfile: () => {},
  incrementReportsUsed: () => true,
  canCreateAudit: () => true,
  isAllowed: () => false,
  logout: () => {},
});

const STORAGE_KEY = 'cransys_current_user_v4';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Миграция старых тарифов
      if (parsed.tier === 'EXPRESS') {
        parsed.tier = 'EXPRESS_PACK';
      }
      if (typeof parsed.reportsUsed !== 'number') {
        parsed.reportsUsed = 1;
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
    const defaultTier: UserTier = 'PRO';
    const config = getTierConfig(defaultTier);
    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      name: name || email.split('@')[0] || 'Пользователь',
      tier: defaultTier,
      reportsUsed: 0,
      reportsLimit: config.reportsLimit,
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
  };

  const loginTestAccount = (tier: UserTier = 'PRO') => {
    const config = getTierConfig(tier);
    const testUser: UserProfile = {
      id: 'test_owner_account',
      email: 'test-owner@cransys-audit.ru',
      name: 'Тестовый аккаунт (Собственник)',
      role: 'TESTER_ADMIN',
      tier: tier,
      reportsUsed: 2, // Демонстрация расхода (2 из лимита)
      reportsLimit: config.reportsLimit,
      agencyName: tier === 'MAX' || tier === 'CORP' ? 'Digital Direct Agency' : undefined,
      agencyContact: tier === 'MAX' || tier === 'CORP' ? '@direct_expert / +7 (999) 000-00-00' : undefined,
      agencyWebsite: tier === 'MAX' || tier === 'CORP' ? 'https://agency-direct.ru' : undefined,
      customNotes: tier === 'MAX' || tier === 'CORP' ? 'Аудит проведен ведущим контекстологом агентства. Обнаружен критический перекос в РСЯ.' : undefined,
      createdAt: new Date().toISOString(),
    };
    setUser(testUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testUser));
    } catch {}
  };

  const setTier = (tier: UserTier) => {
    const config = getTierConfig(tier);
    if (!user) {
      const guestUser: UserProfile = {
        id: 'guest_test_account',
        email: 'guest@cransys-test.ru',
        name: 'Тестовый гость',
        tier: tier,
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

    const updated: UserProfile = {
      ...user,
      tier,
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
    return user.reportsUsed < user.reportsLimit;
  };

  const isAllowed = (feature: 'directApi' | 'aiInsights' | 'searchClustering' | 'rsyaBlacklist' | 'whiteLabel' | 'corpAutomation'): boolean => {
    return isFeatureAllowed(user?.tier, feature);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const currentTierConfig = getTierConfig(user?.tier);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        tierConfig: currentTierConfig,
        login,
        loginTestAccount,
        setTier,
        updateProfile,
        incrementReportsUsed,
        canCreateAudit,
        isAllowed,
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


