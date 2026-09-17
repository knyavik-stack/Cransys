import { NextRequest, NextResponse } from 'next/server';
import { getDirectConnectionByUserId } from '@/lib/db/direct-connections-store';
import { mockMeblironData } from '@/tests/fixtures/mebliron';

export interface DirectCampaignItem {
  id: string;
  name: string;
  state: 'ON' | 'OFF' | 'SUSPENDED' | 'UNKNOWN';
  status: string;
  statusPayment?: string;
  type: string;
  typeLabel: string;
  startDate?: string;
  clicks?: number;
  impressions?: number;
  isDemo?: boolean;
}

function mapCampaignType(type: string): string {
  switch (type) {
    case 'TEXT_CAMPAIGN':
      return 'Текстово-графическая (Поиск/РСЯ)';
    case 'SMART_CAMPAIGN':
      return 'Смарт-баннеры';
    case 'DYNAMIC_TEXT_CAMPAIGN':
      return 'Динамические объявления';
    case 'MCANVAS_CAMPAIGN':
      return 'Медийная кампания';
    case 'CPM_BANNER_CAMPAIGN':
      return 'Баннер на поиске';
    default:
      return type || 'Кампания Директ';
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'current_user';
    const conn = await getDirectConnectionByUserId(userId);

    if (!conn || !conn.accessToken || conn.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'Яндекс.Директ не подключен',
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientLogin = searchParams.get('clientLogin') || conn.login;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${conn.accessToken}`,
      'Accept-Language': 'ru',
    };

    // Если это субклиент агентства, передаем Client-Login
    if (clientLogin && clientLogin !== conn.login) {
      headers['Client-Login'] = clientLogin;
    }

    let campaigns: DirectCampaignItem[] = [];
    let isLiveApi = false;
    let apiError: string | null = null;

    try {
      const directRes = await fetch('https://api.direct.yandex.com/json/v5/campaigns', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          method: 'get',
          params: {
            SelectionCriteria: {},
            FieldNames: ['Id', 'Name', 'State', 'Status', 'StatusPayment', 'Type', 'StartDate', 'Statistics'],
            Page: {
              Limit: 100,
            },
          },
        }),
      });

      if (directRes.ok) {
        const directJson = await directRes.json();
        if (directJson.error) {
          apiError = directJson.error.error_detail || directJson.error.error_string;
          console.warn('[YANDEX DIRECT] API returned error:', directJson.error);
        } else if (Array.isArray(directJson?.result?.Campaigns)) {
          isLiveApi = true;
          campaigns = directJson.result.Campaigns.map((c: any) => ({
            id: String(c.Id),
            name: c.Name || `Кампания #${c.Id}`,
            state: c.State || 'UNKNOWN',
            status: c.Status || '',
            statusPayment: c.StatusPayment,
            type: c.Type || 'TEXT_CAMPAIGN',
            typeLabel: mapCampaignType(c.Type),
            startDate: c.StartDate,
            clicks: c.Statistics?.Clicks || 0,
            impressions: c.Statistics?.Impressions || 0,
            isDemo: false,
          }));
        }
      } else {
        const errText = await directRes.text();
        apiError = `Ошибка ответа Direct API: ${directRes.status}`;
        console.warn('[YANDEX DIRECT] Campaigns request error:', errText);
      }
    } catch (fetchErr: any) {
      console.warn('[YANDEX DIRECT] API Fetch failed, preparing fallback:', fetchErr);
      apiError = fetchErr?.message || 'Сетевая ошибка API Яндекс.Директ';
    }

    // Если API запрос прошел успешно, возвращаем реальные кампании пользователя!
    // Кампании показываются со всеми статусами: активные, остановленные, черновики, архивные.
    if (isLiveApi) {
      if (campaigns.length === 0) {
        return NextResponse.json({
          success: true,
          isLiveApi: true,
          hasLiveCampaigns: false,
          accountLogin: clientLogin,
          apiError: null,
          campaigns: [],
          notice: 'В выбранном кабинете Яндекс.Директ пока не создано ни одной рекламной кампании.',
          totalCampaigns: 0,
        });
      }

      return NextResponse.json({
        success: true,
        isLiveApi: true,
        hasLiveCampaigns: true,
        accountLogin: clientLogin,
        apiError: null,
        campaigns,
        totalCampaigns: campaigns.length,
      });
    }

    // Только если реальный вызов API упал с ошибкой (например, лимиты, не настроен доступ):
    const demoCampaigns: DirectCampaignItem[] = mockMeblironData.campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      state: 'ON',
      status: 'ACCEPTED',
      type: 'TEXT_CAMPAIGN',
      typeLabel: 'Текстово-графическая (Поиск/РСЯ)',
      startDate: '2026-01-15',
      clicks: c.clicks,
      impressions: c.impressions,
      isDemo: true,
    }));

    return NextResponse.json({
      success: true,
      isLiveApi: false,
      hasLiveCampaigns: false,
      accountLogin: clientLogin,
      apiError,
      campaigns: demoCampaigns,
      notice: apiError 
        ? `Ошибка прямого подключения к API (${apiError}). Загружены демонстрационные кампании для тестирования аудита.`
        : 'Загружены демонстрационные кампании для проверки интерфейса аудита.',
      totalCampaigns: demoCampaigns.length,
    });
  } catch (error) {
    console.error('[YANDEX DIRECT] Error listing campaigns:', error);
    return NextResponse.json({
      success: false,
      error: 'Ошибка при получении списка кампаний из Яндекс.Директ',
    }, { status: 500 });
  }
}
