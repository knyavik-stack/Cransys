import fs from 'fs';
import path from 'path';
import { UserTier, TierDefinition, TIER_CONFIGS } from '@/lib/billing/tiers';

const DATA_DIR = path.join(process.cwd(), '.data');
const TIERS_FILE = path.join(DATA_DIR, 'tiers.json');

let memoryTiers: Record<UserTier, TierDefinition> = { ...TIER_CONFIGS };

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

export function saveAllTiers(tiers: Record<UserTier, TierDefinition>): boolean {
  memoryTiers = tiers;
  try {
    ensureDataDir();
    fs.writeFileSync(TIERS_FILE, JSON.stringify(tiers, null, 2), 'utf-8');
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
  const updated = {
    ...current[tierId],
    ...patch,
    priceFormatted: patch.price !== undefined ? `${patch.price.toLocaleString('ru-RU')} ₽` : current[tierId].priceFormatted,
  };
  current[tierId] = updated;
  saveAllTiers(current);
  return updated;
}
