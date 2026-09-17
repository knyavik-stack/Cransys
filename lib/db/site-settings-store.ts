import fs from 'fs';
import path from 'path';
import { DEFAULT_SITE_SETTINGS, SiteSettings } from '@/lib/settings/types';

export * from '@/lib/settings/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const SETTINGS_FILE = path.join(DATA_DIR, 'site-settings.json');

let memorySettings: SiteSettings = { ...DEFAULT_SITE_SETTINGS };

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create .data directory:', e);
    }
  }
}

export function getSiteSettings(): SiteSettings {
  try {
    ensureDataDir();
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        memorySettings = {
          ...DEFAULT_SITE_SETTINGS,
          ...parsed,
          socials: Array.isArray(parsed.socials) ? parsed.socials : DEFAULT_SITE_SETTINGS.socials,
        };
        return memorySettings;
      }
    }
  } catch (e) {
    console.warn('Error reading site settings file:', e);
  }
  return memorySettings;
}

export function updateSiteSettings(patch: Partial<SiteSettings>): SiteSettings {
  const current = getSiteSettings();
  const updated: SiteSettings = {
    ...current,
    ...patch,
  };
  memorySettings = updated;
  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving site settings file:', e);
  }
  return updated;
}
