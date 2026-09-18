import { NextRequest, NextResponse } from 'next/server';
import { getDirectConnectionByUserId } from '@/lib/db/direct-connections-store';

export interface DirectClientAccount {
  login: string;
  clientId?: string;
  name?: string;
  role: 'DIRECT' | 'AGENCY_CLIENT' | 'CHIEF';
  status?: string;
  archived?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'current_user';
    const connectionId = req.nextUrl.searchParams.get('connectionId') || undefined;
    const conn = await getDirectConnectionByUserId(userId, connectionId);

    if (!conn || !conn.accessToken || conn.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'Яндекс.Директ не подключен',
      }, { status: 401 });
    }

    const mainLogin = conn.login || 'Яндекс.Директ';
    const accounts: DirectClientAccount[] = [];
    let isAgency = false;

    // 1. Проверяем, является ли аккаунт агентством с субклиентами
    try {
      const agencyRes = await fetch('https://api.direct.yandex.com/json/v5/agencyclients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${conn.accessToken}`,
          'Accept-Language': 'ru',
        },
        body: JSON.stringify({
          method: 'get',
          params: {
            SelectionCriteria: {
              Archived: 'NO',
            },
            FieldNames: ['ClientId', 'Login', 'ClientInfo', 'Status', 'Archived'],
            Page: {
              Limit: 100,
            },
          },
        }),
      });

      if (agencyRes.ok) {
        const agencyData = await agencyRes.json();
        const clients = agencyData?.result?.Clients;
        if (Array.isArray(clients) && clients.length > 0) {
          isAgency = true;
          clients.forEach((c: any) => {
            accounts.push({
              login: c.Login,
              clientId: String(c.ClientId || ''),
              name: c.ClientInfo || c.Login,
              role: 'AGENCY_CLIENT',
              status: c.Status || 'ACTIVE',
              archived: c.Archived === 'YES',
            });
          });
        }
      }
    } catch (e) {
      console.warn('[YANDEX DIRECT] Agency check skipped or failed:', e);
    }

    // 2. Если не агентство или субклиентов нет — аккаунт является прямым рекламодателем
    if (accounts.length === 0) {
      accounts.push({
        login: mainLogin,
        name: `Основной кабинет (${mainLogin})`,
        role: 'DIRECT',
        status: 'ACTIVE',
        archived: false,
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      isAgency,
      mainLogin,
      accounts,
      totalAccounts: accounts.length,
      connectedAt: conn.connectedAt,
    });
  } catch (error) {
    console.error('[YANDEX DIRECT] Error fetching accounts:', error);
    return NextResponse.json({
      success: false,
      error: 'Ошибка при получении списка кабинетов Яндекс.Директ',
    }, { status: 500 });
  }
}
