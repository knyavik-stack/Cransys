import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramAdminNotification, sendAdminEmailNotification } from '@/lib/notifications/admin-notify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const channel = body.channel || 'all'; // 'telegram' | 'email' | 'all'

    const testTime = new Date().toLocaleString('ru-RU');
    const results: Record<string, any> = {};

    if (channel === 'telegram' || channel === 'all') {
      const tgText = `🔔 <b>ТЕСТОВОЕ УВЕДОМЛЕНИЕ CRANSYS</b>\n\n` +
        `✅ Telegram-бот успешно подключен и готов к отправке уведомлений об оплатах, регистрациях и аудитах.\n` +
        `⏰ <b>Время проверки:</b> ${testTime}`;

      results.telegram = await sendTelegramAdminNotification(tgText);
    }

    if (channel === 'email' || channel === 'all') {
      const emailHtml = `
        <p>Это тестовое служебное уведомление для администратора Cransys.</p>
        <p>Канал отправки Яндекс SMTP работает штатно.</p>
      `;

      results.email = await sendAdminEmailNotification('Тестовая проверка системы оповещений', emailHtml);
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Тестовые уведомления отправлены',
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при отправке тестовых уведомлений' },
      { status: 500 }
    );
  }
}
