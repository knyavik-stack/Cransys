import fs from 'fs';
import path from 'path';
import { CookieConsentRecord, CookieConsentStats } from '@/lib/settings/types';
import { getDb } from '@/db';

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
let isDbTableInitialized = false;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create .data directory for cookie consents:', e);
    }
  }
}

async function ensureDbTable(db: any) {
  if (isDbTableInitialized) return;
  try {
    await (db as any)(`
      CREATE TABLE IF NOT EXISTS public.cookie_consents (
        id VARCHAR(100) PRIMARY KEY,
        choice VARCHAR(30) NOT NULL,
        necessary_allowed BOOLEAN DEFAULT TRUE NOT NULL,
        analytics_allowed BOOLEAN DEFAULT TRUE NOT NULL,
        marketing_allowed BOOLEAN DEFAULT FALSE NOT NULL,
        user_agent VARCHAR(255),
        ip_masked VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);
    await (db as any)(`
      CREATE INDEX IF NOT EXISTS idx_cookie_consents_created_at ON public.cookie_consents(created_at)
    `);
    isDbTableInitialized = true;
  } catch (e) {
    console.warn('Could not initialize cookie_consents table in DB:', e);
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

export async function getCookieConsentDataAsync(): Promise<CookieConsentsData> {
  const db = getDb();
  if (db) {
    try {
      await ensureDbTable(db);
      const rawRes = await (db as any)(`
        SELECT id, choice, necessary_allowed, analytics_allowed, marketing_allowed, user_agent, ip_masked, created_at
        FROM public.cookie_consents
        ORDER BY created_at DESC
        LIMIT 100
      `);

      const rows: any[] = Array.isArray(rawRes) ? rawRes : (rawRes && Array.isArray((rawRes as any).rows) ? (rawRes as any).rows : []);

      if (rows.length > 0) {
        const logs: CookieConsentRecord[] = rows.map((row: any) => ({
          id: row.id,
          timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          choice: (row.choice === 'all' || row.choice === 'necessary' || row.choice === 'custom') ? row.choice : 'all',
          preferences: {
            necessary: Boolean(row.necessary_allowed ?? true),
            analytics: Boolean(row.analytics_allowed ?? true),
            marketing: Boolean(row.marketing_allowed ?? false),
          },
          userAgent: row.user_agent || undefined,
          ipMasked: row.ip_masked || undefined,
        }));

        // Статистика из БД
        const statsRaw = await (db as any)(`
          SELECT 
            COUNT(*)::int as total,
            COUNT(*) FILTER (WHERE choice = 'all')::int as accepted_all,
            COUNT(*) FILTER (WHERE choice = 'necessary')::int as accepted_necessary,
            COUNT(*) FILTER (WHERE choice = 'custom')::int as accepted_custom,
            MAX(created_at) as last_updated
          FROM public.cookie_consents
        `);

        const statsRows: any[] = Array.isArray(statsRaw) ? statsRaw : (statsRaw && Array.isArray((statsRaw as any).rows) ? (statsRaw as any).rows : []);

        if (statsRows.length > 0 && statsRows[0]) {
          const s = statsRows[0];
          const dbData: CookieConsentsData = {
            stats: {
              totalPrompts: Number(s.total) || 0,
              acceptedAll: Number(s.accepted_all) || 0,
              acceptedNecessary: Number(s.accepted_necessary) || 0,
              acceptedCustom: Number(s.accepted_custom) || 0,
              lastUpdated: s.last_updated ? new Date(s.last_updated).toISOString() : new Date().toISOString(),
            },
            recentLogs: logs,
          };
          memoryData = dbData;
          return dbData;
        }
      }
    } catch (e) {
      console.warn('DB error fetching cookie consents, falling back to file:', e);
    }
  }

  return getCookieConsentData();
}

export async function recordCookieConsent(record: {
  choice: 'all' | 'necessary' | 'custom';
  preferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  userAgent?: string;
  ipMasked?: string;
}): Promise<CookieConsentsData> {
  const current = getCookieConsentData();
  const now = new Date().toISOString();
  const id = `cst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newLog: CookieConsentRecord = {
    id,
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

  // 1. Сохранение в локальный файл
  try {
    ensureDataDir();
    fs.writeFileSync(CONSENT_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving cookie consent file:', e);
  }

  // 2. Сохранение в PostgreSQL при наличии подключения
  const db = getDb();
  if (db) {
    try {
      await ensureDbTable(db);
      await (db as any)(
        `INSERT INTO public.cookie_consents 
         (id, choice, necessary_allowed, analytics_allowed, marketing_allowed, user_agent, ip_masked, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          record.choice,
          true,
          Boolean(record.preferences.analytics),
          Boolean(record.preferences.marketing),
          record.userAgent ? record.userAgent.substring(0, 255) : null,
          record.ipMasked || null,
          now,
        ]
      );
    } catch (e) {
      console.warn('DB error writing cookie consent log:', e);
    }
  }

  return updated;
}

