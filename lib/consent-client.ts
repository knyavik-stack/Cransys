'use client';

import { useSyncExternalStore } from 'react';
import { CookiePreferences } from '@/lib/settings/types';

export const COOKIE_STORAGE_KEY = 'cransys_cookie_consent_v1';

let cachedConsent: CookiePreferences | null = null;
let isLoaded = false;

function getStoredConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as CookiePreferences;
    }
  } catch {}
  return null;
}

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToConsent(callback: () => void) {
  listeners.add(callback);

  const handleCustomEvent = () => {
    cachedConsent = getStoredConsent();
    callback();
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === COOKIE_STORAGE_KEY) {
      cachedConsent = getStoredConsent();
      callback();
    }
  };

  window.addEventListener('cookie-consent-updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('cookie-consent-updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

export function useCookieConsent(): CookiePreferences | null {
  return useSyncExternalStore(
    subscribeToConsent,
    () => {
      if (!isLoaded && typeof window !== 'undefined') {
        cachedConsent = getStoredConsent();
        isLoaded = true;
      }
      return cachedConsent;
    },
    () => null
  );
}

export function notifyConsentChanged(pref: CookiePreferences) {
  if (typeof window !== 'undefined') {
    cachedConsent = pref;
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: pref }));
    emitChange();
  }
}
