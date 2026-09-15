import * as XLSX from 'xlsx';
import { z } from 'zod';
import { AuditInputData, CampaignData } from '../audit/types';

export const CampaignRowSchema = z.object({
  campaignName: z.string().min(1),
  campaignId: z.string().optional(),
  spendRub: z.number().nonnegative(),
  clicks: z.number().int().nonnegative().default(0),
  impressions: z.number().int().nonnegative().default(0),
  conversions: z.number().nonnegative().default(0),
  deviceType: z.enum(['MOBILE', 'DESKTOP', 'TABLET', 'UNKNOWN']).default('UNKNOWN'),
  placementType: z.enum(['SEARCH', 'RSYA', 'UNKNOWN']).default('UNKNOWN'),
  strategy: z.string().default('Не указана'),
});

export type CampaignRow = z.infer<typeof CampaignRowSchema>;

function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function detectPlacementType(name: string, rawPlacement?: string): 'SEARCH' | 'RSYA' | 'SMART' | 'UNKNOWN' {
  const upperPlacement = (rawPlacement || '').toUpperCase();
  const upperName = name.toUpperCase();

  if (upperPlacement.includes('СЕТ') || upperPlacement.includes('РСЯ') || upperPlacement.includes('NETWORK')) {
    return 'RSYA';
  }
  if (upperPlacement.includes('ПОИСК') || upperPlacement.includes('SEARCH')) {
    return 'SEARCH';
  }
  if (upperName.includes('РСЯ') || upperName.includes('СЕТИ') || upperName.includes('RSYA') || upperName.includes('КМС')) {
    return 'RSYA';
  }
  if (upperName.includes('ПОИСК') || upperName.includes('SEARCH') || upperName.includes('HOT') || upperName.includes('ГОРЯЧ')) {
    return 'SEARCH';
  }
  if (upperName.includes('СМАРТ') || upperName.includes('ТОВАР') || upperName.includes('МАСТЕР')) {
    return 'SMART';
  }
  return 'UNKNOWN';
}

function detectDevice(rawDevice?: string): 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN' {
  const upper = (rawDevice || '').toUpperCase();
  if (upper.includes('МОБИЛЬН') || upper.includes('ТЕЛЕФОН') || upper.includes('PHONE') || upper.includes('MOBILE')) {
    return 'MOBILE';
  }
  if (upper.includes('ДЕКСТОП') || upper.includes('ПК') || upper.includes('DESKTOP') || upper.includes('КОМПЬЮТЕР')) {
    return 'DESKTOP';
  }
  if (upper.includes('ПЛАНШЕТ') || upper.includes('TABLET')) {
    return 'TABLET';
  }
  return 'UNKNOWN';
}

export function parseDirectExcel(arrayBuffer: ArrayBuffer | Uint8Array): AuditInputData {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Файл не содержит листов для анализа.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (!rows || rows.length < 2) {
    throw new Error('Таблица пуста или содержит недостаточно данных.');
  }

  // Поиск строки с заголовками колонок
  let headerIndex = -1;
  let campaignColIdx = -1;
  let spendColIdx = -1;
  let clicksColIdx = -1;
  let impressionsColIdx = -1;
  let conversionsColIdx = -1;
  let placementColIdx = -1;
  let deviceColIdx = -1;
  let strategyColIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const row = rows[i] as unknown[];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim().toLowerCase();

      if (cell.includes('кампания') || cell.includes('название кампании') || cell.includes('campaign')) {
        campaignColIdx = c;
      } else if (cell.includes('расход') || cell.includes('стоимость') || cell.includes('затраты') || cell.includes('cost') || cell.includes('spend')) {
        spendColIdx = c;
      } else if (cell.includes('клик') || cell.includes('clicks')) {
        clicksColIdx = c;
      } else if (cell.includes('показ') || cell.includes('impressions')) {
        impressionsColIdx = c;
      } else if (cell.includes('конверси') || cell.includes('целевые визиты') || cell.includes('достижения целей') || cell.includes('conversions')) {
        conversionsColIdx = c;
      } else if (cell.includes('площадк') || cell.includes('тип площадки') || cell.includes('сеть')) {
        placementColIdx = c;
      } else if (cell.includes('устройств') || cell.includes('тип устройства') || cell.includes('device')) {
        deviceColIdx = c;
      } else if (cell.includes('стратеги') || cell.includes('strategy')) {
        strategyColIdx = c;
      }
    }

    if (campaignColIdx !== -1 && (spendColIdx !== -1 || clicksColIdx !== -1)) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1 || campaignColIdx === -1 || spendColIdx === -1) {
    throw new Error(
      'Не удалось распознать структуру отчета Яндекс.Директ. Убедитесь, что в файле есть колонки «Кампания» и «Расход».'
    );
  }

  // Агрегация данных по кампаниям
  const campaignsMap = new Map<string, CampaignData>();
  let grandTotalSpend = 0;
  let grandTotalConversions = 0;

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawCampName = String(row[campaignColIdx] || '').trim();
    if (!rawCampName || rawCampName.toLowerCase().startsWith('итого') || rawCampName.toLowerCase().startsWith('всего')) {
      continue;
    }

    const spend = parseNumber(row[spendColIdx]);
    const clicks = clicksColIdx !== -1 ? Math.round(parseNumber(row[clicksColIdx])) : 0;
    const impressions = impressionsColIdx !== -1 ? Math.round(parseNumber(row[impressionsColIdx])) : 0;
    const conversions = conversionsColIdx !== -1 ? parseNumber(row[conversionsColIdx]) : 0;

    const rawPlacement = placementColIdx !== -1 ? String(row[placementColIdx] || '') : '';
    const rawDevice = deviceColIdx !== -1 ? String(row[deviceColIdx] || '') : '';
    const rawStrategy = strategyColIdx !== -1 ? String(row[strategyColIdx] || '') : 'Автостратегия';

    const detectedType = detectPlacementType(rawCampName, rawPlacement);
    const detectedDev = detectDevice(rawDevice);

    grandTotalSpend += spend;
    grandTotalConversions += conversions;

    const existing = campaignsMap.get(rawCampName);
    if (!existing) {
      campaignsMap.set(rawCampName, {
        id: `camp-${campaignsMap.size + 1}`,
        name: rawCampName,
        type: detectedType,
        strategy: rawStrategy,
        spendRub: spend,
        clicks,
        impressions,
        conversions,
        desktopSpendRub: detectedDev === 'DESKTOP' ? spend : 0,
        desktopConversions: detectedDev === 'DESKTOP' ? conversions : 0,
        mobileSpendRub: detectedDev === 'MOBILE' ? spend : 0,
        mobileConversions: detectedDev === 'MOBILE' ? conversions : 0,
      });
    } else {
      existing.spendRub += spend;
      existing.clicks += clicks;
      existing.impressions += impressions;
      existing.conversions += conversions;
      if (detectedDev === 'DESKTOP') {
        existing.desktopSpendRub = (existing.desktopSpendRub || 0) + spend;
        existing.desktopConversions = (existing.desktopConversions || 0) + conversions;
      } else if (detectedDev === 'MOBILE') {
        existing.mobileSpendRub = (existing.mobileSpendRub || 0) + spend;
        existing.mobileConversions = (existing.mobileConversions || 0) + conversions;
      }
      if (existing.type === 'UNKNOWN' && detectedType !== 'UNKNOWN') {
        existing.type = detectedType;
      }
    }
  }

  const campaigns = Array.from(campaignsMap.values());
  if (campaigns.length === 0) {
    throw new Error('В отчете не обнаружено строк с рекламными кампаниями.');
  }

  return {
    campaigns,
    totalSpendRub: Math.round(grandTotalSpend * 100) / 100,
    totalConversions: Math.round(grandTotalConversions * 100) / 100,
    currency: 'RUB',
  };
}
