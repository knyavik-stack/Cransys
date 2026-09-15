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
    // Удаляем неразрывные пробелы, символы валют и заменяем запятую на точку
    const cleaned = value.replace(/[\s\u00A0₽rubRUB$]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Интеллектуальный декодер текста CSV с поддержкой Windows-1251 и UTF-8
 */
function decodeCsvBuffer(buffer: Uint8Array): string {
  // Проверка UTF-8 BOM
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer.slice(3));
  }

  // Пробуем UTF-8
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(buffer);
  } catch {
    // Если fatal сработал, значит Windows-1251
    try {
      const win1251Decoder = new TextDecoder('windows-1251');
      return win1251Decoder.decode(buffer);
    } catch {
      return new TextDecoder('utf-8').decode(buffer);
    }
  }
}

/**
 * Парсер CSV с автодетекцией разделителя (; , \t) и учетом кавычек
 */
function parseCsvToRows(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Подсчет разделителей в первых 5 строках
  const sample = lines.slice(0, Math.min(lines.length, 5)).join('\n');
  const countSemicolon = (sample.match(/;/g) || []).length;
  const countComma = (sample.match(/,/g) || []).length;
  const countTab = (sample.match(/\t/g) || []).length;

  let delimiter = ';';
  if (countTab > countSemicolon && countTab > countComma) {
    delimiter = '\t';
  } else if (countComma > countSemicolon) {
    delimiter = ',';
  }

  const result: string[][] = [];
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }

  return result;
}

function detectPlacementType(name: string, rawPlacement?: string, clicks = 0, impressions = 0): 'SEARCH' | 'RSYA' | 'SMART' | 'UNKNOWN' {
  const upperPlacement = (rawPlacement || '').toUpperCase();
  const upperName = name.toUpperCase();

  if (
    upperPlacement.includes('СЕТ') ||
    upperPlacement.includes('РСЯ') ||
    upperPlacement.includes('NETWORK') ||
    upperPlacement.includes('CONTEXT')
  ) {
    return 'RSYA';
  }
  if (upperPlacement.includes('ПОИСК') || upperPlacement.includes('SEARCH')) {
    return 'SEARCH';
  }
  if (
    upperName.includes('РСЯ') ||
    upperName.includes('СЕТИ') ||
    upperName.includes('RSYA') ||
    upperName.includes('КМС') ||
    upperName.includes('NET')
  ) {
    return 'RSYA';
  }
  if (
    upperName.includes('ПОИСК') ||
    upperName.includes('SEARCH') ||
    upperName.includes('HOT') ||
    upperName.includes('ГОРЯЧ') ||
    upperName.includes('ТЕПЛ')
  ) {
    return 'SEARCH';
  }
  if (upperName.includes('СМАРТ') || upperName.includes('ТОВАР') || upperName.includes('МАСТЕР') || upperName.includes('МК')) {
    return 'SMART';
  }

  // Маркетинговая эвристика по CTR (если в названии нет явной метки)
  if (impressions > 500 && clicks > 0) {
    const ctr = (clicks / impressions) * 100;
    if (ctr < 0.9) return 'RSYA'; // В РСЯ CTR обычно 0.1 - 0.7%
    if (ctr > 2.5) return 'SEARCH'; // На Поиске CTR обычно от 3% до 25%
  }

  return 'UNKNOWN';
}

function detectDevice(rawDevice?: string, name?: string): 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN' {
  const upper = `${rawDevice || ''} ${name || ''}`.toUpperCase();
  if (
    upper.includes('МОБИЛЬН') ||
    upper.includes('ТЕЛЕФОН') ||
    upper.includes('PHONE') ||
    upper.includes('MOBILE') ||
    upper.includes('СМАРТФОН')
  ) {
    return 'MOBILE';
  }
  if (
    upper.includes('ДЕКСТОП') ||
    upper.includes('ДЕСТКОП') ||
    upper.includes('ПК') ||
    upper.includes('DESKTOP') ||
    upper.includes('КОМПЬЮТЕР')
  ) {
    return 'DESKTOP';
  }
  if (upper.includes('ПЛАНШЕТ') || upper.includes('TABLET')) {
    return 'TABLET';
  }
  return 'UNKNOWN';
}

export function parseDirectExcel(arrayBuffer: ArrayBuffer | Uint8Array): AuditInputData {
  const uint8 = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);

  let rows: unknown[][] = [];

  // Проверяем, не CSV ли это по первым байтам или попытке XLSX
  const isBinaryZip = uint8[0] === 0x50 && uint8[1] === 0x4b; // PK zip (XLSX)
  const isOldExcel = uint8[0] === 0xd0 && uint8[1] === 0xcf; // OLE2 (XLS)

  if (!isBinaryZip && !isOldExcel) {
    // Это CSV или текстовый отчет
    try {
      const decodedText = decodeCsvBuffer(uint8);
      rows = parseCsvToRows(decodedText);
    } catch {
      // Fallback к XLSX
    }
  }

  if (rows.length === 0) {
    try {
      const workbook = XLSX.read(uint8, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Файл не содержит листов для анализа.');
      }
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    } catch {
      // Если XLSX упал на текстовом файле, повторим через текстовый парсер
      const decodedText = decodeCsvBuffer(uint8);
      rows = parseCsvToRows(decodedText);
    }
  }

  if (!rows || rows.length < 2) {
    throw new Error('Таблица пуста или содержит недостаточно строк для анализа.');
  }

  // Расширенный словарь соответствия колонок
  let headerIndex = -1;
  let campaignColIdx = -1;
  let queryColIdx = -1;
  let spendColIdx = -1;
  let clicksColIdx = -1;
  let impressionsColIdx = -1;
  let conversionsColIdx = -1;
  let placementColIdx = -1;
  let deviceColIdx = -1;
  let strategyColIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i] as unknown[];
    if (!Array.isArray(row) || row.length === 0) continue;

    let foundCamp = -1;
    let foundQuery = -1;
    let foundSpend = -1;

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim().toLowerCase();

      // Поисковый запрос / Условие показа
      if (
        cell.includes('поисков') ||
        cell.includes('запрос') ||
        cell.includes('search query') ||
        cell.includes('фраза') ||
        cell.includes('условие показа')
      ) {
        if (foundQuery === -1) foundQuery = c;
      }

      // Кампания
      if (
        cell === 'кампания' ||
        cell === 'название кампании' ||
        cell.includes('кампани') ||
        cell.includes('campaign') ||
        cell === '№ кампании' ||
        cell === 'номер кампании' ||
        cell.includes('группа') ||
        cell.includes('объявление')
      ) {
        if (foundCamp === -1) foundCamp = c;
      }

      // Расход / Затраты
      if (
        cell.includes('расход') ||
        cell.includes('стоимост') ||
        cell.includes('затрат') ||
        cell.includes('cost') ||
        cell.includes('spend') ||
        cell.includes('сумма') ||
        cell.includes('списан') ||
        cell.includes('всего потрачено')
      ) {
        if (foundSpend === -1) foundSpend = c;
      }

      // Клики
      if (cell.includes('клик') || cell.includes('clicks')) {
        clicksColIdx = c;
      }

      // Показы
      if (cell.includes('показ') || cell.includes('impress')) {
        impressionsColIdx = c;
      }

      // Конверсии / Целевые действия
      if (
        cell.includes('конверси') ||
        cell.includes('целев') ||
        cell.includes('достижен') ||
        cell.includes('conv') ||
        cell.includes('лид') ||
        cell.includes('заявк')
      ) {
        conversionsColIdx = c;
      }

      // Тип площадки
      if (
        cell.includes('площадк') ||
        cell.includes('место показ') ||
        cell.includes('сеть') ||
        cell.includes('сетей') ||
        cell.includes('placement') ||
        cell.includes('network')
      ) {
        placementColIdx = c;
      }

      // Тип устройства
      if (cell.includes('устройств') || cell.includes('device')) {
        deviceColIdx = c;
      }

      // Стратегия
      if (cell.includes('стратеги') || cell.includes('strategy')) {
        strategyColIdx = c;
      }
    }

    if ((foundCamp !== -1 || foundQuery !== -1) && foundSpend !== -1) {
      headerIndex = i;
      campaignColIdx = foundCamp !== -1 ? foundCamp : foundQuery;
      queryColIdx = foundQuery;
      spendColIdx = foundSpend;
      break;
    }
  }


  // Если заголовки явно не найдены, берем эвристику (колонка 0 — имя, колонка с максимальными суммами — расход)
  if (headerIndex === -1 || campaignColIdx === -1 || spendColIdx === -1) {
    headerIndex = 0;
    campaignColIdx = 0;
    // Ищем первую числовую колонку с суммами
    for (let c = 1; c < (rows[1]?.length || 2); c++) {
      const val = parseNumber(rows[1]?.[c]);
      if (val > 0) {
        spendColIdx = c;
        break;
      }
    }
  }

  // Агрегация кампаний и поисковых фраз
  const campaignsMap = new Map<string, CampaignData>();
  const searchQueriesList: { query: string; clicks: number; impressions: number; spendRub: number; conversions: number }[] = [];
  let grandTotalSpend = 0;
  let grandTotalConversions = 0;

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawCampName = String(row[campaignColIdx] || '').trim();
    if (
      !rawCampName ||
      rawCampName.toLowerCase().startsWith('итого') ||
      rawCampName.toLowerCase().startsWith('всего') ||
      rawCampName.toLowerCase().startsWith('total')
    ) {
      continue;
    }

    const spend = parseNumber(row[spendColIdx]);
    const clicks = clicksColIdx !== -1 ? Math.round(parseNumber(row[clicksColIdx])) : 0;
    const impressions = impressionsColIdx !== -1 ? Math.round(parseNumber(row[impressionsColIdx])) : 0;
    const conversions = conversionsColIdx !== -1 ? parseNumber(row[conversionsColIdx]) : 0;

    // Сохраняем поисковый запрос, если есть колонка запросов
    if (queryColIdx !== -1 && row[queryColIdx]) {
      const qText = String(row[queryColIdx]).trim();
      if (qText && qText !== '-' && !qText.startsWith('---')) {
        searchQueriesList.push({
          query: qText,
          clicks,
          impressions,
          spendRub: spend,
          conversions,
        });
      }
    }

    const rawPlacement = placementColIdx !== -1 ? String(row[placementColIdx] || '') : '';
    const rawDevice = deviceColIdx !== -1 ? String(row[deviceColIdx] || '') : '';
    const rawStrategy = strategyColIdx !== -1 ? String(row[strategyColIdx] || '') : 'Автостратегия';

    const detectedType = detectPlacementType(rawCampName, rawPlacement, clicks, impressions);
    const detectedDev = detectDevice(rawDevice, rawCampName);

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
    throw new Error('В файле не обнаружено строк с рекламными кампаниями.');
  }

  return {
    campaigns,
    searchQueries: searchQueriesList.length > 0 ? searchQueriesList : undefined,
    totalSpendRub: Math.round(grandTotalSpend * 100) / 100,
    totalConversions: Math.round(grandTotalConversions * 100) / 100,
    currency: 'RUB',
  };

}
