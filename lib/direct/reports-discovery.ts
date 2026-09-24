/**
 * Discovery-модуль для поиска и извлечения кампаний из Reports API Яндекс.Директа.
 * Используется, когда стандартный метод campaigns.get возвращает пустой список (например,
 * для неоплаченных кампаний, остановленных из-за нулевого баланса, архивированных,
 * кампаний ЕПК или переведенных в другие режимы Мастера Кампаний).
 */

export interface DiscoveredReportCampaign {
  id: string;
  name: string;
  type: string;
  impressions: number;
  clicks: number;
  cost: number;
  state: 'OFF' | 'SUSPENDED' | 'ARCHIVED' | 'ON';
  stateLabel: string;
  isStopped: boolean;
  status: string;
  statusClarification: string;
}

export async function discoverCampaignsFromReports(
  accessToken: string,
  clientLogin?: string
): Promise<DiscoveredReportCampaign[]> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const runReportFetch = async (useClientLogin: boolean): Promise<DiscoveredReportCampaign[]> => {
      const reportName = `Disc_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

      // Запрашиваем сводный отчет эффективности по всем кампаниям
      const xml = `
<ReportDefinition xmlns="http://api.direct.yandex.com/v5/reports">
  <SelectionCriteria>
    <DateFrom>2024-01-01</DateFrom>
    <DateTo>${today}</DateTo>
  </SelectionCriteria>
  <FieldNames>CampaignId</FieldNames>
  <FieldNames>CampaignName</FieldNames>
  <FieldNames>CampaignType</FieldNames>
  <FieldNames>Impressions</FieldNames>
  <FieldNames>Clicks</FieldNames>
  <FieldNames>Cost</FieldNames>
  <ReportName>${reportName}</ReportName>
  <ReportType>CAMPAIGN_PERFORMANCE_REPORT</ReportType>
  <DateRangeType>CUSTOM_DATE</DateRangeType>
  <Format>TSV</Format>
  <IncludeVAT>YES</IncludeVAT>
</ReportDefinition>`.trim();

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept-Language': 'ru',
        'processingMode': 'auto',
        'returnMoneyInMicros': 'false',
        'skipReportHeader': 'true',
        'skipReportSummary': 'true',
      };

      if (useClientLogin && clientLogin) {
        headers['Client-Login'] = clientLogin;
      }

      const endpoint = 'https://api.direct.yandex.com/v5/reports';

      // Опрашиваем отчет с интервалом (до 10 попыток с обработкой статусов 201 и 202)
      for (let attempt = 0; attempt < 10; attempt++) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: xml,
        });

        if (res.status === 200) {
          const text = await res.text();
          const lines = text.trim().split('\n');
          const campaigns: DiscoveredReportCampaign[] = [];

          let idCol = 0;
          let nameCol = 1;
          let typeCol = 2;
          let imprCol = 3;
          let clickCol = 4;
          let costCol = 5;

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            const parts = line.split('\t');

            // Заголовочная строка
            if (parts.includes('CampaignId')) {
              idCol = parts.indexOf('CampaignId');
              nameCol = parts.indexOf('CampaignName') !== -1 ? parts.indexOf('CampaignName') : 1;
              typeCol = parts.indexOf('CampaignType') !== -1 ? parts.indexOf('CampaignType') : 2;
              imprCol = parts.indexOf('Impressions') !== -1 ? parts.indexOf('Impressions') : 3;
              clickCol = parts.indexOf('Clicks') !== -1 ? parts.indexOf('Clicks') : 4;
              costCol = parts.indexOf('Cost') !== -1 ? parts.indexOf('Cost') : 5;
              continue;
            }

            if (parts.length > idCol) {
              const campId = (parts[idCol] || '').trim();
              if (!campId || isNaN(Number(campId))) continue;

              const campName = (parts[nameCol] || `Кампания #${campId}`).trim();
              const campType = (parts[typeCol] || 'TEXT_CAMPAIGN').trim();
              const impressions = Number(parts[imprCol]) || 0;
              const clicks = Number(parts[clickCol]) || 0;
              const cost = Number(parts[costCol]) || 0;

              // Проверяем, нет ли уже в массиве
              if (!campaigns.some((c) => c.id === campId)) {
                campaigns.push({
                  id: campId,
                  name: campName,
                  type: campType,
                  impressions,
                  clicks,
                  cost,
                  state: 'OFF',
                  stateLabel: 'Остановлена (требует оплаты)',
                  isStopped: true,
                  status: 'PAYMENT_PENDING',
                  statusClarification: 'Не оплачена / Остановлена из-за баланса',
                });
              }
            }
          }

          return campaigns;
        }

        // 201: отчет поставлен в очередь, 202: отчет формируется
        if (res.status === 201 || res.status === 202) {
          const retryHeader = res.headers.get('retryIn');
          const waitMs = retryHeader ? Math.max(Number(retryHeader) * 1000, 1500) : 2000;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        // Если с Client-Login вернулась ошибка доступа/запроса — пробуем без заголовка
        if (useClientLogin && (res.status === 400 || res.status === 403)) {
          return [];
        }

        console.warn(`[DIRECT REPORTS DISCOVERY] Unexpected HTTP status: ${res.status}`);
        break;
      }

      return [];
    };

    // 1. Сначала пробуем с clientLogin (если указан)
    let results: DiscoveredReportCampaign[] = [];
    if (clientLogin) {
      results = await runReportFetch(true);
    }

    // 2. Если ничего не найдено или clientLogin не был указан — запрашиваем от имени владельца токена
    if (results.length === 0) {
      results = await runReportFetch(false);
    }

    return results;
  } catch (err) {
    console.warn('[DIRECT REPORTS DISCOVERY] Failed to discover campaigns from reports:', err);
    return [];
  }
}

export interface CampaignDeviceStats {
  campaignId: string;
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  desktopSpend: number;
  desktopConversions: number;
  desktopClicks: number;
  mobileSpend: number;
  mobileConversions: number;
  mobileClicks: number;
}

export async function fetchCampaignDeviceStats(
  accessToken: string,
  clientLogin?: string,
  dateFrom?: string,
  dateTo?: string,
  campaignIds?: string[]
): Promise<Map<string, CampaignDeviceStats>> {
  const result = new Map<string, CampaignDeviceStats>();
  try {
    const today = new Date().toISOString().split('T')[0];
    const effectiveFrom = dateFrom || '2024-01-01';
    const effectiveTo = dateTo || today;
    const reportName = `Dev_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    const campFilterXml =
      campaignIds && campaignIds.length > 0
        ? `<Filter>
            <Field>CampaignId</Field>
            <Operator>IN</Operator>
            ${campaignIds.map((id) => `<Values>${id}</Values>`).join('\n')}
          </Filter>`
        : '';

    const xml = `
<ReportDefinition xmlns="http://api.direct.yandex.com/v5/reports">
  <SelectionCriteria>
    <DateFrom>${effectiveFrom}</DateFrom>
    <DateTo>${effectiveTo}</DateTo>
    ${campFilterXml}
  </SelectionCriteria>
  <FieldNames>CampaignId</FieldNames>
  <FieldNames>Device</FieldNames>
  <FieldNames>Impressions</FieldNames>
  <FieldNames>Clicks</FieldNames>
  <FieldNames>Cost</FieldNames>
  <FieldNames>Conversions</FieldNames>
  <ReportName>${reportName}</ReportName>
  <ReportType>CUSTOM_REPORT</ReportType>
  <DateRangeType>CUSTOM_DATE</DateRangeType>
  <Format>TSV</Format>
  <IncludeVAT>YES</IncludeVAT>
</ReportDefinition>`.trim();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Accept-Language': 'ru',
      processingMode: 'auto',
      returnMoneyInMicros: 'false',
      skipReportHeader: 'true',
      skipReportSummary: 'true',
    };
    if (clientLogin) {
      headers['Client-Login'] = clientLogin;
    }

    const endpoint = 'https://api.direct.yandex.com/v5/reports';

    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: xml,
      });

      if (res.status === 200) {
        const text = await res.text();
        const lines = text.trim().split('\n');

        let idIdx = 0;
        let devIdx = 1;
        let impIdx = 2;
        let clkIdx = 3;
        let costIdx = 4;
        let convIdx = 5;

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;
          const parts = line.split('\t');

          if (parts.includes('CampaignId')) {
            idIdx = parts.indexOf('CampaignId');
            devIdx = parts.indexOf('Device') !== -1 ? parts.indexOf('Device') : 1;
            impIdx = parts.indexOf('Impressions') !== -1 ? parts.indexOf('Impressions') : 2;
            clkIdx = parts.indexOf('Clicks') !== -1 ? parts.indexOf('Clicks') : 3;
            costIdx = parts.indexOf('Cost') !== -1 ? parts.indexOf('Cost') : 4;
            convIdx = parts.indexOf('Conversions') !== -1 ? parts.indexOf('Conversions') : 5;
            continue;
          }

          if (parts.length > idIdx) {
            const campId = (parts[idIdx] || '').trim();
            if (!campId || isNaN(Number(campId))) continue;

            const rawDev = (parts[devIdx] || '').toUpperCase();
            const impressions = Number(parts[impIdx]) || 0;
            const clicks = Number(parts[clkIdx]) || 0;
            const cost = Number(parts[costIdx]) || 0;
            const conversions = Number(parts[convIdx]) || 0;

            let existing = result.get(campId);
            if (!existing) {
              existing = {
                campaignId: campId,
                totalSpend: 0,
                totalClicks: 0,
                totalImpressions: 0,
                totalConversions: 0,
                desktopSpend: 0,
                desktopConversions: 0,
                desktopClicks: 0,
                mobileSpend: 0,
                mobileConversions: 0,
                mobileClicks: 0,
              };
              result.set(campId, existing);
            }

            existing.totalSpend += cost;
            existing.totalClicks += clicks;
            existing.totalImpressions += impressions;
            existing.totalConversions += conversions;

            const isMobile = rawDev.includes('MOBILE') || rawDev.includes('SMARTPHONE');
            const isDesktop = rawDev.includes('DESKTOP') || rawDev.includes('TABLET');

            if (isMobile) {
              existing.mobileSpend += cost;
              existing.mobileConversions += conversions;
              existing.mobileClicks += clicks;
            } else if (isDesktop) {
              existing.desktopSpend += cost;
              existing.desktopConversions += conversions;
              existing.desktopClicks += clicks;
            }
          }
        }
        return result;
      }

      if (res.status === 201 || res.status === 202) {
        const retryHeader = res.headers.get('retryIn');
        const waitMs = retryHeader ? Math.max(Number(retryHeader) * 1000, 1500) : 2000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      break;
    }
  } catch (err) {
    console.warn('[DIRECT REPORTS DEVICE STATS] Error fetching device stats:', err);
  }
  return result;
}

export async function fetchCampaignSearchQueries(
  accessToken: string,
  clientLogin?: string,
  dateFrom?: string,
  dateTo?: string,
  campaignIds?: string[]
): Promise<{ query: string; clicks: number; impressions: number; spendRub: number; conversions: number }[]> {
  const queries: { query: string; clicks: number; impressions: number; spendRub: number; conversions: number }[] = [];
  try {
    const today = new Date().toISOString().split('T')[0];
    const effectiveFrom = dateFrom || '2024-01-01';
    const effectiveTo = dateTo || today;
    const reportName = `Qry_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    const campFilterXml =
      campaignIds && campaignIds.length > 0
        ? `<Filter>
            <Field>CampaignId</Field>
            <Operator>IN</Operator>
            ${campaignIds.map((id) => `<Values>${id}</Values>`).join('\n')}
          </Filter>`
        : '';

    const xml = `
<ReportDefinition xmlns="http://api.direct.yandex.com/v5/reports">
  <SelectionCriteria>
    <DateFrom>${effectiveFrom}</DateFrom>
    <DateTo>${effectiveTo}</DateTo>
    ${campFilterXml}
  </SelectionCriteria>
  <FieldNames>Query</FieldNames>
  <FieldNames>Impressions</FieldNames>
  <FieldNames>Clicks</FieldNames>
  <FieldNames>Cost</FieldNames>
  <FieldNames>Conversions</FieldNames>
  <ReportName>${reportName}</ReportName>
  <ReportType>SEARCH_QUERY_PERFORMANCE_REPORT</ReportType>
  <DateRangeType>CUSTOM_DATE</DateRangeType>
  <Format>TSV</Format>
  <IncludeVAT>YES</IncludeVAT>
</ReportDefinition>`.trim();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Accept-Language': 'ru',
      processingMode: 'auto',
      returnMoneyInMicros: 'false',
      skipReportHeader: 'true',
      skipReportSummary: 'true',
    };
    if (clientLogin) {
      headers['Client-Login'] = clientLogin;
    }

    const endpoint = 'https://api.direct.yandex.com/v5/reports';

    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: xml,
      });

      if (res.status === 200) {
        const text = await res.text();
        const lines = text.trim().split('\n');

        let qIdx = 0;
        let impIdx = 1;
        let clkIdx = 2;
        let costIdx = 3;
        let convIdx = 4;

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;
          const parts = line.split('\t');

          if (parts.includes('Query')) {
            qIdx = parts.indexOf('Query');
            impIdx = parts.indexOf('Impressions') !== -1 ? parts.indexOf('Impressions') : 1;
            clkIdx = parts.indexOf('Clicks') !== -1 ? parts.indexOf('Clicks') : 2;
            costIdx = parts.indexOf('Cost') !== -1 ? parts.indexOf('Cost') : 3;
            convIdx = parts.indexOf('Conversions') !== -1 ? parts.indexOf('Conversions') : 4;
            continue;
          }

          if (parts.length > qIdx) {
            const queryText = (parts[qIdx] || '').trim();
            if (!queryText || queryText === '-' || queryText.startsWith('---')) continue;

            const impressions = Number(parts[impIdx]) || 0;
            const clicks = Number(parts[clkIdx]) || 0;
            const cost = Number(parts[costIdx]) || 0;
            const conversions = Number(parts[convIdx]) || 0;

            queries.push({
              query: queryText,
              impressions,
              clicks,
              spendRub: cost,
              conversions,
            });

            if (queries.length >= 100) break; // Топ-100 реальных запросов
          }
        }
        return queries;
      }

      if (res.status === 201 || res.status === 202) {
        const retryHeader = res.headers.get('retryIn');
        const waitMs = retryHeader ? Math.max(Number(retryHeader) * 1000, 1500) : 2000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      break;
    }
  } catch (err) {
    console.warn('[DIRECT REPORTS SEARCH QUERIES] Error fetching search queries:', err);
  }
  return queries;
}
