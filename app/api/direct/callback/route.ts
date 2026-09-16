import { NextRequest, NextResponse } from 'next/server';
import { saveDirectConnection } from '@/lib/db/direct-connections-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?direct_error=${encodeURIComponent(errorDescription || error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard?direct_error=missing_code', req.url)
    );
  }

  const clientId = process.env.YANDEX_CLIENT_ID;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('[YANDEX DIRECT] Missing YANDEX_CLIENT_ID or YANDEX_CLIENT_SECRET');
    return NextResponse.redirect(
      new URL('/dashboard?direct_error=server_not_configured', req.url)
    );
  }

  try {
    // Обмен кода авторизации на токен доступа
    const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[YANDEX DIRECT] Token exchange failed:', tokenData);
      return NextResponse.redirect(
        new URL(`/dashboard?direct_error=${encodeURIComponent(tokenData.error_description || 'token_exchange_failed')}`, req.url)
      );
    }

    // Получаем информацию о пользователе Яндекса (логин)
    let login = 'Яндекс.Директ';
    try {
      const userRes = await fetch('https://login.yandex.ru/info?format=json', {
        headers: {
          Authorization: `OAuth ${tokenData.access_token}`,
        },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        login = userData.login || userData.default_email || login;
      }
    } catch (e) {
      console.warn('Error fetching Yandex user info:', e);
    }

    // Сохраняем подключение в базу
    // Привязываем к текущему юзеру (или к дефолтному тестеру, если cookie/id будет синхронизирован на клиенте)
    const connection = await saveDirectConnection({
      userId: 'current_user',
      userEmail: login,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      login,
    });

    return NextResponse.redirect(
      new URL(`/dashboard?direct_success=1&login=${encodeURIComponent(login)}&conn_id=${connection.id}`, req.url)
    );
  } catch (err) {
    console.error('[YANDEX DIRECT] OAuth callback fatal error:', err);
    return NextResponse.redirect(
      new URL('/dashboard?direct_error=internal_error', req.url)
    );
  }
}
