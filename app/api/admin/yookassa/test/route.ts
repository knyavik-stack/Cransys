import { NextRequest, NextResponse } from 'next/server';
import { fetchSiteSettingsAsync } from '@/lib/db/site-settings-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const settings = await fetchSiteSettingsAsync();

    const shopId = (body.shopId || settings.yookassa?.shopId || process.env.YOOKASSA_SHOP_ID || '').trim();
    const secretKey = (body.secretKey || settings.yookassa?.secretKey || process.env.YOOKASSA_SECRET_KEY || '').trim();

    if (!shopId || !secretKey) {
      return NextResponse.json({
        success: false,
        error: 'Shop ID и Секретный ключ API обязательны для проверки подключения',
      });
    }

    const authHeader = 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    // Проверяем через официальный эндпоинт информации о магазине в ЮKassa v3
    const yooRes = await fetch('https://api.yookassa.ru/v3/me', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await yooRes.json().catch(() => ({}));

    if (yooRes.ok && (data.account_id || data.id || data.status)) {
      return NextResponse.json({
        success: true,
        accountId: data.account_id || data.id || shopId,
        testMode: Boolean(data.test),
        fiscalization: data.fiscalization || null,
        status: data.status || 'active',
        message: 'Соединение с ЮKassa API успешно подтверждено! Магазин активен.',
      });
    }

    if (yooRes.status === 401) {
      return NextResponse.json({
        success: false,
        error: 'Ошибка авторизации (401): Неверный Shop ID или Секретный ключ API',
        details: data,
      });
    }

    if (yooRes.status === 403) {
      return NextResponse.json({
        success: false,
        error: 'Доступ запрещен (403): Проверьте права API ключа в личном кабинете ЮKassa',
        details: data,
      });
    }

    return NextResponse.json({
      success: false,
      error: data.description || data.message || `Ошибка ЮKassa API (HTTP ${yooRes.status})`,
      details: data,
    });
  } catch (error: any) {
    console.error('Yookassa connection test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Сетевой сбой при обращении к шлюзу ЮKassa',
      },
      { status: 500 }
    );
  }
}
