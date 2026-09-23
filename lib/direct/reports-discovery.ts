/**
 * Discovery-модуль для поиска и извлечения кампаний из Reports API Яндекс.Директа.
 * Используется, когда стандартный метод campaigns.get возвращает пустой список (например,
 * для неоплаченных кампаний, остановленных из-за нулевого баланса, архивированных
 * или переведенных в другие режимы Мастера Кампаний).
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
    const reportName = `Disc_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    // Запрашиваем сводный отчет по кампаниям за все время
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

    if (clientLogin) {
      headers['Client-Login'] = clientLogin;
    }

    const endpoint = 'https://api.direct.yandex.com/v5/reports';

    // В режиме auto/offline опрашиваем отчет с интервалом (до 3 попыток)
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: xml,
      });

      if (res.status === 200) {
        const text = await res.text();
        const lines = text.trim().split('\n');
        const campaigns: DiscoveredReportCampaign[] = [];

        for (const line of lines) {
          const parts = line.split('\t');
          if (parts.length >= 6 && parts[0] !== 'CampaignId') {
            const campId = parts[0].trim();
            const campName = parts[1].trim();
            const campType = parts[2].trim() || 'TEXT_CAMPAIGN';
            const impressions = Number(parts[3]) || 0;
            const clicks = Number(parts[4]) || 0;
            const cost = Number(parts[5]) || 0;

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

        return campaigns;
      }

      if (res.status === 201) {
        // Отчет в очереди обработки — ждем 1.5 секунды перед следующим запросом
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      console.warn(`[DIRECT REPORTS DISCOVERY] Non-200/201 response: ${res.status}`);
      break;
    }

    return [];
  } catch (err) {
    console.warn('[DIRECT REPORTS DISCOVERY] Failed to discover campaigns from reports:', err);
    return [];
  }
}
