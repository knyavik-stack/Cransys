import { NextRequest, NextResponse } from 'next/server';
import { getDirectConnectionByUserId } from '@/lib/db/direct-connections-store';
import { mockMeblironData } from '@/tests/fixtures/mebliron';

export interface DirectCampaignItem {
  id: string;
  name: string;
  state: 'ON' | 'OFF' | 'SUSPENDED' | 'ENDED' | 'ARCHIVED' | 'UNKNOWN';
  stateLabel: string;
  isStopped: boolean;
  status: string;
  statusPayment?: string;
  type: string;
  typeLabel: string;
  startDate?: string;
  clicks?: number;
  impressions?: number;
  currency?: string;
  isDemo?: boolean;
}

function mapCampaignType(type: string): string {
  switch (type) {
    case 'TEXT_CAMPAIGN':
      return 'Текстово-графическая (Поиск/РСЯ)';
    case 'UNIFIED_CAMPAIGN':
      return 'Единая перфоманс-кампания (ЕПК)';
    case 'SMART_CAMPAIGN':
      return 'Товарная / Смарт-баннеры';
    case 'DYNAMIC_TEXT_CAMPAIGN':
      return 'Динамические объявления';
    case 'MCANVAS_CAMPAIGN':
      return 'Медийная кампания';
    case 'CPM_BANNER_CAMPAIGN':
      return 'Баннер на поиске';
    case 'LEAD_FORM_CAMPAIGN':
      return 'Кампания с лид-формами';
    default:
      return type || 'Кампания Директ';
  }
}

function mapCampaignState(state: string): { label: string; isStopped: boolean } {
  switch (state) {
    case 'ON':
      return { label: 'Идут показы', isStopped: false };
    case 'SUSPENDED':
      return { label: 'Приостановлена', isStopped: true };
    case 'OFF':
      return { label: 'Остановлена', isStopped: true };
    case 'ENDED':
      return { label: 'Завершена', isStopped: true };
    case 'ARCHIVED':
      return { label: 'В архиве', isStopped: true };
    default:
      return { label: state || 'Неизвестно', isStopped: state !== 'ON' };
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'current_user';
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get('connectionId') || undefined;

    const conn = await getDirectConnectionByUserId(userId, connectionId);

    if (!conn || !conn.accessToken || conn.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: 'Яндекс.Директ не подключен',
        },
        { status: 401 }
      );
    }

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
    let isTokenExpired = false;

    try {
      // Запрашиваем ВСЕ кампании: активные, остановленные, завершенные и архивные!
      const directRes = await fetch('https://api.direct.yandex.com/json/v5/campaigns', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          method: 'get',
          params: {
            SelectionCriteria: {
              States: ['ON', 'OFF', 'SUSPENDED', 'ENDED', 'ARCHIVED'],
            },
            FieldNames: [
              'Id',
              'Name',
              'State',
              'Status',
              'StatusPayment',
              'Type',
              'StartDate',
              'Statistics',
              'Currency',
            ],
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
          if (directJson.error.error_code === 53 || directJson.error.error_code === 52) {
            isTokenExpired = true;
          }
          console.warn('[YANDEX DIRECT] API returned error:', directJson.error);
        } else if (Array.isArray(directJson?.result?.Campaigns)) {
          isLiveApi = true;
          campaigns = directJson.result.Campaigns.map((c: any) => {
            const stateInfo = mapCampaignState(c.State);
            return {
              id: String(c.Id),
              name: c.Name || `Кампания #${c.Id}`,
              state: c.State || 'UNKNOWN',
              stateLabel: stateInfo.label,
              isStopped: stateInfo.isStopped,
              status: c.Status || '',
              statusPayment: c.StatusPayment,
              type: c.Type || 'TEXT_CAMPAIGN',
              typeLabel: mapCampaignType(c.Type),
              startDate: c.StartDate,
              clicks: Number(c.Statistics?.Clicks) || 0,
              impressions: Number(c.Statistics?.Impressions) || 0,
              currency: c.Currency || 'RUB',
              isDemo: false,
            };
          });
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
    if (isLiveApi) {
      if (campaigns.length === 0) {
        return NextResponse.json({
          success: true,
          isLiveApi: true,
          hasLiveCampaigns: false,
          accountLogin: clientLogin,
          apiError: null,
          campaigns: [],
          notice:
            'В выбранном кабинете Яндекс.Директ пока не создано ни одной кампании. Создайте кампанию в Директе или выберите другой аккаунт.',
          totalCampaigns: 0,
        });
      }

      const activeCount = campaigns.filter((c) => !c.isStopped).length;
      const stoppedCount = campaigns.filter((c) => c.isStopped).length;

      return NextResponse.json({
        success: true,
        isLiveApi: true,
        hasLiveCampaigns: true,
        accountLogin: clientLogin,
        apiError: null,
        campaigns,
        totalCampaigns: campaigns.length,
        activeCount,
        stoppedCount,
        notice:
          stoppedCount > 0 && activeCount === 0
            ? `В кабинете ${stoppedCount} кампаний с остановленными показами. Вы можете выбрать их для аудита настроек, минус-фраз и готовности к возобновлению.`
            : null,
      });
    }

    // Если вызов API упал с ошибкой (например, токен истек или ошибка авторизации):
    const demoCampaigns: DirectCampaignItem[] = [
      {
        id: '10482910',
        name: 'Поиск | Мебель на заказ | Москва и МО',
        state: 'ON',
        stateLabel: 'Идут показы',
        isStopped: false,
        status: 'ACCEPTED',
        type: 'TEXT_CAMPAIGN',
        typeLabel: 'Текстово-графическая (Поиск)',
        startDate: '2026-01-15',
        clicks: 480,
        impressions: 28800,
        currency: 'RUB',
        isDemo: true,
      },
      {
        id: '10482911',
        name: 'РСЯ | Диваны и мягкая мебель | РФ (Остановлена)',
        state: 'SUSPENDED',
        stateLabel: 'Приостановлена',
        isStopped: true,
        status: 'ACCEPTED',
        type: 'TEXT_CAMPAIGN',
        typeLabel: 'Текстово-графическая (РСЯ)',
        startDate: '2025-11-20',
        clicks: 340,
        impressions: 89000,
        currency: 'RUB',
        isDemo: true,
      },
      {
        id: '10482912',
        name: 'Смарт-баннеры | Каталог кухонь (Пауза)',
        state: 'OFF',
        stateLabel: 'Остановлена',
        isStopped: true,
        status: 'ACCEPTED',
        type: 'SMART_CAMPAIGN',
        typeLabel: 'Товарная / Смарт-баннеры',
        startDate: '2025-08-10',
        clicks: 120,
        impressions: 14500,
        currency: 'RUB',
        isDemo: true,
      },
      {
        id: '10482913',
        name: 'ЕПК | Готовые шкафы-купе | Акция',
        state: 'ON',
        stateLabel: 'Идут показы',
        isStopped: false,
        status: 'ACCEPTED',
        type: 'UNIFIED_CAMPAIGN',
        typeLabel: 'Единая перфоманс-кампания (ЕПК)',
        startDate: '2026-02-01',
        clicks: 290,
        impressions: 18200,
        currency: 'RUB',
        isDemo: true,
      },
    ];

    let userFriendlyNotice = 'Загружен демонстрационный снимок кампаний для тестирования интерфейса аудита.';
    if (isTokenExpired) {
      userFriendlyNotice = 'Срок действия авторизации Яндекс ID истек. Пожалуйста, нажмите «Переподключить», чтобы обновить доступ к вашим кампаниям.';
    } else if (apiError) {
      userFriendlyNotice = `Ответ API Яндекс.Директ: ${apiError}. Для наглядности отображены примеры кампаний с активным и остановленным статусом.`;
    }

    return NextResponse.json({
      success: true,
      isLiveApi: false,
      isTokenExpired,
      hasLiveCampaigns: false,
      accountLogin: clientLogin,
      apiError,
      campaigns: demoCampaigns,
      totalCampaigns: demoCampaigns.length,
      activeCount: demoCampaigns.filter((c) => !c.isStopped).length,
      stoppedCount: demoCampaigns.filter((c) => c.isStopped).length,
      notice: userFriendlyNotice,
    });
  } catch (error) {
    console.error('[YANDEX DIRECT] Error listing campaigns:', error);
    return NextResponse.json({
      success: false,
      error: 'Ошибка при получении списка кампаний из Яндекс.Директ',
    }, { status: 500 });
  }
}
