'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserTier, TierDefinition, TIER_CONFIGS, TIER_LIST } from './tiers';

let globalCachedTiers: Record<UserTier, TierDefinition> = { ...TIER_CONFIGS };
let globalCachedList: TierDefinition[] = [...TIER_LIST];
let hasFetched = false;
const subscribers = new Set<() => void>();

export function notifyTiersUpdated(newTiers?: Record<UserTier, TierDefinition>) {
  if (newTiers) {
    globalCachedTiers = newTiers;
    globalCachedList = Object.values(newTiers);
    hasFetched = true;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cransys_tiers_cache', JSON.stringify(newTiers));
        localStorage.setItem('cransys_tiers_timestamp', Date.now().toString());
      }
    } catch {}
  }
  subscribers.forEach((cb) => cb());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cransys_tiers_changed', { detail: newTiers }));
  }
}

export function useTiers() {
  const [tiers, setTiers] = useState<Record<UserTier, TierDefinition>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cransys_tiers_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            globalCachedTiers = parsed;
            globalCachedList = Object.values(parsed);
          }
        }
      } catch {}
    }
    return globalCachedTiers;
  });
  const [tierList, setTierList] = useState<TierDefinition[]>(globalCachedList);
  const [isLoading, setIsLoading] = useState(!hasFetched);

  const fetchTiers = useCallback(async () => {
    try {
      const res = await fetch('/api/tiers', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.tiers) {
        globalCachedTiers = data.tiers;
        globalCachedList = data.tierList || Object.values(data.tiers);
        hasFetched = true;
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('cransys_tiers_cache', JSON.stringify(data.tiers));
            localStorage.setItem('cransys_tiers_timestamp', Date.now().toString());
          }
        } catch {}
        setTiers(globalCachedTiers);
        setTierList(globalCachedList);
        subscribers.forEach((cb) => cb());
      }
    } catch (e) {
      console.warn('Failed to fetch dynamic tiers:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const handleUpdate = () => {
      if (!ignore) {
        setTiers(globalCachedTiers);
        setTierList(globalCachedList);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        globalCachedTiers = customEvent.detail;
        globalCachedList = Object.values(customEvent.detail);
        setTiers(globalCachedTiers);
        setTierList(globalCachedList);
      } else {
        fetchTiers();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cransys_tiers_cache' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          globalCachedTiers = parsed;
          globalCachedList = Object.values(parsed);
          setTiers(globalCachedTiers);
          setTierList(globalCachedList);
        } catch {}
      }
    };

    subscribers.add(handleUpdate);
    if (typeof window !== 'undefined') {
      window.addEventListener('cransys_tiers_changed', handleCustomEvent);
      window.addEventListener('storage', handleStorageChange);
    }

    // Всегда актуализируем тарифы при монтировании хука
    fetchTiers();

    return () => {
      ignore = true;
      subscribers.delete(handleUpdate);
      if (typeof window !== 'undefined') {
        window.removeEventListener('cransys_tiers_changed', handleCustomEvent);
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [fetchTiers]);

  const getTier = useCallback((tierKey: string | null | undefined): TierDefinition => {
    if (!tierKey) return tiers.EXPRESS_SINGLE || TIER_CONFIGS.EXPRESS_SINGLE;
    if (tierKey in tiers) {
      return tiers[tierKey as UserTier];
    }
    if (tierKey === 'EXPRESS') return tiers.EXPRESS_PACK || TIER_CONFIGS.EXPRESS_PACK;
    return tiers.PRO || TIER_CONFIGS.PRO;
  }, [tiers]);

  return {
    tiers,
    tierList,
    isLoading,
    getTier,
    refreshTiers: fetchTiers,
  };
}

