import fs from 'fs';
import path from 'path';
import { DEFAULT_SITE_SETTINGS, SiteSettings } from '@/lib/settings/types';
import { getDb, ensureDatabaseReady } from '@/db';

export * from '@/lib/settings/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const SETTINGS_FILE = path.join(DATA_DIR, 'site-settings.json');

let memorySettings: SiteSettings = { ...DEFAULT_SITE_SETTINGS };
let hasLoadedFromDb = false;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create .data directory:', e);
    }
  }
}

function mergeSettings(parsed: any): SiteSettings {
  if (!parsed || typeof parsed !== 'object') {
    return memorySettings;
  }
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...parsed,
    supportEmail: parsed.supportEmail || DEFAULT_SITE_SETTINGS.supportEmail,
    companyName: parsed.companyName || DEFAULT_SITE_SETTINGS.companyName,
    seo: {
      ...DEFAULT_SITE_SETTINGS.seo,
      ...(parsed.seo || {}),
    },
    webmasters: {
      ...DEFAULT_SITE_SETTINGS.webmasters,
      ...(parsed.webmasters || {}),
    },
    analytics: {
      ...DEFAULT_SITE_SETTINGS.analytics,
      ...(parsed.analytics || {}),
    },
    customScripts: {
      ...DEFAULT_SITE_SETTINGS.customScripts,
      ...(parsed.customScripts || {}),
    },
    cookieBanner: {
      ...DEFAULT_SITE_SETTINGS.cookieBanner,
      ...(parsed.cookieBanner || {}),
    },
    socials: Array.isArray(parsed.socials) ? parsed.socials : DEFAULT_SITE_SETTINGS.socials,
  };
}

export async function fetchSiteSettingsAsync(): Promise<SiteSettings> {
  try {
    const isReady = await ensureDatabaseReady();
    const sql = getDb();
    if (isReady && sql) {
      const rows = (await (sql as any)`
        SELECT settings FROM public.app_settings WHERE id = 'global' LIMIT 1
      `) as any[];

      if (rows && rows.length > 0 && rows[0].settings) {
        memorySettings = mergeSettings(rows[0].settings);
        hasLoadedFromDb = true;
        // Кэшируем в файл
        ensureDataDir();
        try {
          fs.writeFileSync(SETTINGS_FILE, JSON.stringify(memorySettings, null, 2), 'utf-8');
        } catch {
          // ignore
        }
        return memorySettings;
      }
    }
  } catch (e) {
    console.warn('Could not fetch settings from DB, fallback to file:', e);
  }

  return getSiteSettings();
}

export function getSiteSettings(): SiteSettings {
  try {
    ensureDataDir();
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memorySettings = mergeSettings(parsed);
      return memorySettings;
    }
  } catch (e) {
    console.warn('Error reading site settings file:', e);
  }
  return memorySettings;
}

export async function saveSiteSettingsAsync(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = hasLoadedFromDb ? memorySettings : await fetchSiteSettingsAsync();
  const updated: SiteSettings = {
    ...current,
    ...patch,
    supportEmail: patch.supportEmail !== undefined ? patch.supportEmail : current.supportEmail,
    companyName: patch.companyName !== undefined ? patch.companyName : current.companyName,
    seo: {
      ...current.seo,
      ...(patch.seo || {}),
    },
    webmasters: {
      ...current.webmasters,
      ...(patch.webmasters || {}),
    },
    analytics: {
      ...current.analytics,
      ...(patch.analytics || {}),
    },
    customScripts: {
      ...current.customScripts,
      ...(patch.customScripts || {}),
    },
    cookieBanner: {
      ...current.cookieBanner,
      ...(patch.cookieBanner || {}),
    },
    socials: Array.isArray(patch.socials) ? patch.socials : current.socials,
  };

  memorySettings = updated;

  // Сохраняем в файл
  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving site settings file:', e);
  }

  // Сохраняем в PostgreSQL (Neon)
  try {
    const isReady = await ensureDatabaseReady();
    const sql = getDb();
    if (isReady && sql) {
      await (sql as any)`
        INSERT INTO public.app_settings (id, settings, updated_at)
        VALUES ('global', ${JSON.stringify(updated)}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE
        SET settings = ${JSON.stringify(updated)}::jsonb, updated_at = NOW()
      `;
      hasLoadedFromDb = true;
    }
  } catch (e) {
    console.warn('Error saving site settings to DB:', e);
  }

  return updated;
}

export function updateSiteSettings(patch: Partial<SiteSettings>): SiteSettings {
  const current = getSiteSettings();
  const updated: SiteSettings = {
    ...current,
    ...patch,
    supportEmail: patch.supportEmail !== undefined ? patch.supportEmail : current.supportEmail,
    companyName: patch.companyName !== undefined ? patch.companyName : current.companyName,
    seo: {
      ...current.seo,
      ...(patch.seo || {}),
    },
    webmasters: {
      ...current.webmasters,
      ...(patch.webmasters || {}),
    },
    analytics: {
      ...current.analytics,
      ...(patch.analytics || {}),
    },
    customScripts: {
      ...current.customScripts,
      ...(patch.customScripts || {}),
    },
    cookieBanner: {
      ...current.cookieBanner,
      ...(patch.cookieBanner || {}),
    },
    socials: Array.isArray(patch.socials) ? patch.socials : current.socials,
  };
  memorySettings = updated;
  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving site settings file:', e);
  }

  // Фоновая синхронизация с DB
  saveSiteSettingsAsync(patch).catch((err) => {
    console.warn('Background save to DB failed:', err);
  });

  return updated;
}

