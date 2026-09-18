import { NextRequest, NextResponse } from 'next/server';
import {
  saveDirectConnection,
  getDirectSlotsUsageForMonth,
  recordDirectSlotUsage,
} from '@/lib/db/direct-connections-store';
import { findUserById } from '@/lib/db/users-store';
import { getTierConfig } from '@/lib/billing/tiers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const rawState = searchParams.get('state');

  let targetUserId = req.cookies.get('yandex_auth_user')?.value || 'current_user';
  let isPopup = req.cookies.get('yandex_auth_popup')?.value === '1';

  if (rawState) {
    try {
      const decoded = JSON.parse(Buffer.from(rawState, 'base64url').toString('utf-8'));
      if (decoded.userId) targetUserId = decoded.userId;
      if (decoded.popup === '1') isPopup = true;
    } catch {}
  }

  const renderPopupResponse = (success: boolean, message: string, payload?: { login?: string }) => {
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>Авторизация Яндекс.Директ</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .icon { width: 48px; height: 48px; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .success { background: #ecfdf5; color: #059669; }
    .error { background: #fef2f2; color: #dc2626; }
    h2 { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    p { font-size: 13px; color: #64748b; margin: 0 0 16px; line-height: 1.5; }
    .btn { display: inline-block; padding: 8px 16px; font-size: 13px; font-weight: 600; color: #fff; background: #2563eb; border-radius: 8px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon ${success ? 'success' : 'error'}">${success ? '✓' : '✕'}</div>
    <h2>${success ? 'Подключение успешно!' : 'Ошибка авторизации'}</h2>
    <p>${message}</p>
    <a href="/dashboard" class="btn" onclick="window.close();">Вернуться в кабинет</a>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'YANDEX_DIRECT_CONNECTED',
          success: ${success ? 'true' : 'false'},
          login: '${payload?.login || ''}',
          userId: '${targetUserId}',
          error: '${success ? '' : message}'
        }, '*');
      }
    } catch(e) {}
    ${success ? 'setTimeout(() => { window.close(); }, 1200);' : ''}
  </script>
</body>
</html>`;
    return new NextResponse(html, {
      status: success ? 200 : 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  };

  if (error) {
    const errorMsg = errorDescription || error;
    if (isPopup) return renderPopupResponse(false, errorMsg);
    return NextResponse.redirect(
      new URL(`/dashboard?direct_error=${encodeURIComponent(errorMsg)}`, req.url)
    );
  }

  if (!code) {
    if (isPopup) return renderPopupResponse(false, 'Код авторизации не получен от Яндекса');
    return NextResponse.redirect(
      new URL('/dashboard?direct_error=missing_code', req.url)
    );
  }

  const clientId = process.env.YANDEX_CLIENT_ID;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('[YANDEX DIRECT] Missing YANDEX_CLIENT_ID or YANDEX_CLIENT_SECRET');
    if (isPopup) return renderPopupResponse(false, 'На сервере не настроены ключи Yandex OAuth');
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
      const errTxt = tokenData.error_description || 'Ошибка обмена токена';
      if (isPopup) return renderPopupResponse(false, errTxt);
      return NextResponse.redirect(
        new URL(`/dashboard?direct_error=${encodeURIComponent(errTxt)}`, req.url)
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

    // --- ПРОВЕРКА СЛОТОВ ТАРИФА (ЗАЩИТА ОТ КАРУСЕЛИ КАБИНЕТОВ) ---
    const user = await findUserById(targetUserId);
    const tier = user?.tier || 'PRO';
    const tierConfig = getTierConfig(tier);
    const maxSlots = tierConfig.maxConnectedAccounts || 1;
    const isSuperAdmin = user?.role === 'ADMIN' || user?.role === 'TESTER_ADMIN';

    // Получаем список уникальных логинов, привязанных за текущий месяц
    const slotsUsage = await getDirectSlotsUsageForMonth(targetUserId);
    const alreadyUsedThisLogin = slotsUsage.usedLogins.includes(login);

    // Если этот логин еще не подключался в этом месяце и лимит слотов исчерпан
    if (!isSuperAdmin && !alreadyUsedThisLogin && slotsUsage.count >= maxSlots) {
      const errorMsg = `Исчерпан лимит уникальных рекламных кабинетов для тарифа ${tierConfig.name} (доступно: ${maxSlots} шт. в месяц). В этом месяце уже использованы слоты: ${slotsUsage.usedLogins.join(', ')}. Для подключения дополнительных кабинетов перейдите на тариф MAX или CORP.`;
      console.warn(`[DIRECT OAUTH] Slot limit exceeded for user ${targetUserId}. Used: ${slotsUsage.count}, Max: ${maxSlots}`);
      
      if (isPopup) return renderPopupResponse(false, errorMsg);
      return NextResponse.redirect(
        new URL(`/dashboard?direct_error=${encodeURIComponent(errorMsg)}`, req.url)
      );
    }

    // Фиксируем логин в слотную историю расчетного месяца
    await recordDirectSlotUsage(targetUserId, login);
    if (targetUserId !== 'current_user') {
      await recordDirectSlotUsage('current_user', login);
    }

    // Сохраняем подключение для целевого пользователя
    const connection = await saveDirectConnection({
      userId: targetUserId,
      userEmail: login,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      login,
    });

    // Также дублируем для 'current_user' если targetUserId отличается
    if (targetUserId !== 'current_user') {
      try {
        await saveDirectConnection({
          userId: 'current_user',
          userEmail: login,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          login,
        });
      } catch {}
    }

    if (isPopup) {
      return renderPopupResponse(true, `Аккаунт <b>${login}</b> успешно подключен к системе аудита.`, { login });
    }

    return NextResponse.redirect(
      new URL(`/dashboard?direct_success=1&login=${encodeURIComponent(login)}&conn_id=${connection.id}`, req.url)
    );
  } catch (err) {
    console.error('[YANDEX DIRECT] OAuth callback fatal error:', err);
    if (isPopup) return renderPopupResponse(false, 'Внутренняя ошибка сервера при обработке авторизации');
    return NextResponse.redirect(
      new URL('/dashboard?direct_error=internal_error', req.url)
    );
  }
}
