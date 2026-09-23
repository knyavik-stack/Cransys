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
