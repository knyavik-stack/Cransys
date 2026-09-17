import fs from 'fs';
import path from 'path';
import { CookieConsentRecord, CookieConsentStats } from '@/lib/settings/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const CONSENT_FILE = path.join(DATA_DIR, 'cookie-consents.json');

export interface CookieConsentsData {
  stats: CookieConsentStats;
  recentLogs: CookieConsentRecord[];
}

const DEFAULT_DATA: CookieConsentsData = {
  stats: {
    totalPrompts: 0,
    acceptedAll: 0,
    acceptedNecessary: 0,
    acceptedCustom: 0,
    lastUpdated: new Date().toISOString(),
  },
  recentLogs: [],
};

let memoryData: CookieConsentsData = { ...DEFAULT_DATA };

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create .data directory for cookie consents:', e);
    }
  }
}

export function getCookieConsentData(): CookieConsentsData {
  try {
    ensureDataDir();
    if (fs.existsSync(CONSENT_FILE)) {
      const content = fs.readFileSync(CONSENT_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        memoryData = {
          stats: {
            ...DEFAULT_DATA.stats,
            ...(parsed.stats || {}),
          },
          recentLogs: Array.isArray(parsed.recentLogs) ? parsed.recentLogs.slice(0, 100) : [],
        };
        return memoryData;
      }
    }
  } catch (e) {
    console.warn('Error reading cookie consent file:', e);
  }
  return memoryData;
}

export function recordCookieConsent(record: {
  choice: 'all' | 'necessary' | 'custom';
  preferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  userAgent?: string;
  ipMasked?: string;
}): CookieConsentsData {
  const current = getCookieConsentData();
  const now = new Date().toISOString();

  const newLog: CookieConsentRecord = {
    id: `cst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now,
    choice: record.choice,
    preferences: {
      necessary: true,
      analytics: Boolean(record.preferences.analytics),
      marketing: Boolean(record.preferences.marketing),
    },
    userAgent: record.userAgent ? record.userAgent.substring(0, 120) : undefined,
    ipMasked: record.ipMasked,
  };

  const updatedStats: CookieConsentStats = {
    totalPrompts: current.stats.totalPrompts + 1,
    acceptedAll: current.stats.acceptedAll + (record.choice === 'all' ? 1 : 0),
    acceptedNecessary: current.stats.acceptedNecessary + (record.choice === 'necessary' ? 1 : 0),
    acceptedCustom: current.stats.acceptedCustom + (record.choice === 'custom' ? 1 : 0),
    lastUpdated: now,
  };

  const updatedLogs = [newLog, ...current.recentLogs].slice(0, 100);

  const updated: CookieConsentsData = {
    stats: updatedStats,
    recentLogs: updatedLogs,
  };

  memoryData = updated;

  try {
    ensureDataDir();
    fs.writeFileSync(CONSENT_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving cookie consent file:', e);
  }

  return updated;
}
