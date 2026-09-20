'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserTier, TierDefinition, TIER_CONFIGS, TIER_LIST } from './tiers';

let globalCachedTiers: Record<UserTier, TierDefinition> = { ...TIER_CONFIGS };
let globalCachedList: TierDefinition[] = [...TIER_LIST];
let hasFetched = false;
const subscribers = new Set<() => void>();

export function useTiers() {
  const [tiers, setTiers] = useState<Record<UserTier, TierDefinition>>(globalCachedTiers);
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

    subscribers.add(handleUpdate);

    if (!hasFetched) {
      fetch('/api/tiers', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (ignore) return;
          if (data.success && data.tiers) {
            globalCachedTiers = data.tiers;
            globalCachedList = data.tierList || Object.values(data.tiers);
            hasFetched = true;
            setTiers(globalCachedTiers);
            setTierList(globalCachedList);
            subscribers.forEach((cb) => cb());
          }
        })
        .catch((e) => {
          console.warn('Failed to fetch dynamic tiers:', e);
        })
        .finally(() => {
          if (!ignore) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      ignore = true;
      subscribers.delete(handleUpdate);
    };
  }, []);

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
