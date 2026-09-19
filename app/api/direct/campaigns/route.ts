import { NextRequest, NextResponse } from 'next/server';
import { getDirectConnectionByUserId } from '@/lib/db/direct-connections-store';

export interface DirectCampaignItem {
  id: string;
  name: string;
  state: 'ON' | 'OFF' | 'SUSPENDED' | 'ENDED' | 'ARCHIVED' | 'UNKNOWN';
  stateLabel: string;
  isStopped: boolean;
  status: string;
  statusClarification?: string;
  type: string;
  typeLabel: string;
  startDate?: string;
  dailyBudget?: {
    amount: number;
    mode: string;
  };
  clicks?: number;
  impressions?: number;
  currency?: string;
  isDemo: false;
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
          error: 'Яндекс.Директ не подключен или сессия была отключена.',
          campaigns: [],
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

    // Если это агентский аккаунт и выбран конкретный субклиент
    if (clientLogin && clientLogin !== conn.login) {
      headers['Client-Login'] = clientLogin;
    }

    // Запрашиваем ВСЕ кампании пользователя: явно передаем полный список States, включая ARCHIVED и CONVERTED, чтобы гарантированно видеть любые кампании
    const directRes = await fetch('https://api.direct.yandex.com/json/v5/campaigns', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        method: 'get',
        params: {
          SelectionCriteria: {
            States: ['ON', 'OFF', 'SUSPENDED', 'ENDED', 'ARCHIVED', 'CONVERTED'],
          },
          FieldNames: [
            'Id',
            'Name',
            'State',
            'Status',
            'Type',
            'StartDate',
            'Currency',
            'DailyBudget',
            'StatusClarification',
          ],
          Page: {
            Limit: 1000,
          },
        },
      }),
    });

    if (!directRes.ok) {
      const errText = await directRes.text();
      console.warn('[YANDEX DIRECT] API HTTP error:', directRes.status, errText);
      return NextResponse.json({
        success: false,
        isLiveApi: false,
        connected: true,
        accountLogin: clientLogin,
        apiError: `Сервер Яндекс.Директ ответил со статусом ${directRes.status}`,
        errorCode: directRes.status,
        campaigns: [],
        totalCampaigns: 0,
      });
    }

    const directJson = await directRes.json();

    // Обработка ошибок от API Яндекс.Директ
    if (directJson.error) {
      const errCode = directJson.error.error_code;
      const errDetail = directJson.error.error_detail || directJson.error.error_string || 'Неизвестная ошибка API';
      const isTokenExpired = errCode === 53 || errCode === 52;
      const isApplicationNotApproved = errCode === 58;

      console.warn('[YANDEX DIRECT] API returned error:', directJson.error);

      let customNotice = `Ошибка Яндекс.Директ API: ${errDetail} (код ${errCode})`;
      if (isTokenExpired) {
        customNotice = 'Срок действия токена Яндекс ID истек или у приложения не активирован доступ к API Яндекс.Директ (direct:api).';
      } else if (isApplicationNotApproved) {
        customNotice = 'Для OAuth-приложения требуется подтвердить доступ к API в интерфейсе Директа (код 58). Пожалуйста, подтвердите заявку на странице настроек API Директа.';
      }

      return NextResponse.json({
        success: false,
        isLiveApi: false,
        isTokenExpired,
        isApplicationNotApproved,
        connected: true,
        accountLogin: clientLogin,
        apiError: errDetail,
        errorCode: errCode,
        campaigns: [], // СТРОГО ПУСТОЙ МАССИВ: никаких демо-данных!
        totalCampaigns: 0,
        notice: customNotice,
      });
    }

    // Успешный ответ с кампаниями пользователя
    const rawCampaigns = Array.isArray(directJson?.result?.Campaigns) ? directJson.result.Campaigns : [];

    const campaigns: DirectCampaignItem[] = rawCampaigns.map((c: any) => {
      const stateInfo = mapCampaignState(c.State);
      return {
        id: String(c.Id),
        name: c.Name || `Кампания #${c.Id}`,
        state: c.State || 'UNKNOWN',
        stateLabel: stateInfo.label,
        isStopped: stateInfo.isStopped,
        status: c.Status || '',
        statusClarification: c.StatusClarification,
        type: c.Type || 'TEXT_CAMPAIGN',
        typeLabel: mapCampaignType(c.Type),
        startDate: c.StartDate,
        dailyBudget: c.DailyBudget
          ? {
              amount: Number(c.DailyBudget.Amount) / 1000000 || 0,
              mode: c.DailyBudget.Mode || '',
            }
          : undefined,
        clicks: 0,
        impressions: 0,
        currency: c.Currency || 'RUB',
        isDemo: false,
      };
    });

    if (campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        isLiveApi: true,
        hasLiveCampaigns: false,
        accountLogin: clientLogin,
        apiError: null,
        campaigns: [],
        totalCampaigns: 0,
        activeCount: 0,
        stoppedCount: 0,
        notice: `В подключенном кабинете «${clientLogin || 'Яндекс.Директ'}» пока не найдено кампаний. Создайте кампанию в Яндекс.Директ или подключите другой кабинет.`,
      });
    }

    const activeCount = campaigns.filter((c) => !c.isStopped).length;
    const stoppedCount = campaigns.filter((c) => c.isStopped).length;

    let notice: string | null = null;
    if (stoppedCount > 0 && activeCount === 0) {
      notice = `В кабинете ${stoppedCount} ${stoppedCount === 1 ? 'кампания' : 'кампаний'} с остановленными показами. Все они доступны для комплексного аудита настроек, минус-фраз и рисков.`;
    } else if (stoppedCount > 0) {
      notice = `Загружено ${campaigns.length} кампаний (${activeCount} активных, ${stoppedCount} остановленных). Доступен аудит как работающих, так и приостановленных кампаний.`;
    }

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
      notice,
    });
  } catch (error: any) {
    console.error('[YANDEX DIRECT] Fatal error listing campaigns:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Внутренняя ошибка при запросе кампаний из Яндекс.Директ',
        details: error?.message || 'Неизвестная ошибка',
        campaigns: [],
      },
      { status: 500 }
    );
  }
}
