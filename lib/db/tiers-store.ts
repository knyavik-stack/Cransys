import fs from 'fs';
import path from 'path';
import { UserTier, TierDefinition, TIER_CONFIGS } from '@/lib/billing/tiers';
import { getDb, ensureDatabaseReady } from '@/db';

const DATA_DIR = path.join(process.cwd(), '.data');
const TIERS_FILE = path.join(DATA_DIR, 'tiers.json');

let memoryTiers: Record<UserTier, TierDefinition> = { ...TIER_CONFIGS };
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

export function getAllTiers(): Record<UserTier, TierDefinition> {
  try {
    ensureDataDir();
    if (fs.existsSync(TIERS_FILE)) {
      const content = fs.readFileSync(TIERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        memoryTiers = { ...TIER_CONFIGS, ...parsed };
        return memoryTiers;
      }
    }
  } catch (e) {
    console.warn('Error reading tiers file:', e);
  }
  return memoryTiers;
}

export async function fetchAllTiersAsync(): Promise<Record<UserTier, TierDefinition>> {
  try {
    const isReady = await ensureDatabaseReady();
    const sql = getDb();
    if (isReady && sql) {
      const rows = (await (sql as any)`
        SELECT settings FROM public.app_settings WHERE id = 'tiers' LIMIT 1
      `) as any[];

      if (rows && rows.length > 0 && rows[0].settings) {
        memoryTiers = { ...TIER_CONFIGS, ...rows[0].settings };
        hasLoadedFromDb = true;
        ensureDataDir();
        try {
          fs.writeFileSync(TIERS_FILE, JSON.stringify(memoryTiers, null, 2), 'utf-8');
        } catch {}
        return memoryTiers;
      }
    }
  } catch (e) {
    console.warn('Could not fetch tiers from DB, fallback to file:', e);
  }
  return getAllTiers();
}

export function getTierList(): TierDefinition[] {
  const tiers = getAllTiers();
  return Object.values(tiers);
}

export function saveAllTiers(tiers: Record<UserTier, TierDefinition>): boolean {
  memoryTiers = tiers;
  try {
    ensureDataDir();
    fs.writeFileSync(TIERS_FILE, JSON.stringify(tiers, null, 2), 'utf-8');

    // Асинхронно сохраняем в PostgreSQL (Neon)
    ensureDatabaseReady().then((ready) => {
      if (ready) {
        const sql = getDb();
        if (sql) {
          (sql as any)`
            INSERT INTO public.app_settings (id, settings, updated_at)
            VALUES ('tiers', ${JSON.stringify(tiers)}::jsonb, NOW())
            ON CONFLICT (id) DO UPDATE
            SET settings = ${JSON.stringify(tiers)}::jsonb, updated_at = NOW()
          `.catch((err: any) => console.warn('Error saving tiers to DB:', err));
        }
      }
    }).catch(() => {});

    return true;
  } catch (e) {
    console.warn('Error saving tiers file:', e);
    return false;
  }
}

export function updateTierConfig(
  tierId: UserTier,
  patch: Partial<TierDefinition>
): TierDefinition {
  const current = getAllTiers();
  if (!current[tierId]) {
    current[tierId] = { ...TIER_CONFIGS[tierId] };
  }

  const existing = current[tierId];
  const newPrice = patch.price !== undefined ? Number(patch.price) : existing.price;
  const newPriceFormatted = patch.priceFormatted || (patch.price !== undefined ? `${newPrice.toLocaleString('ru-RU')} ₽` : existing.priceFormatted);

  const updated: TierDefinition = {
    ...existing,
    ...patch,
    price: newPrice,
    priceFormatted: newPriceFormatted,
    features: Array.isArray(patch.features) ? patch.features : existing.features,
  };

  current[tierId] = updated;
  saveAllTiers(current);
  return updated;
}
