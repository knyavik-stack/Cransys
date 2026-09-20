import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramAlert, sendEmailAlert } from '@/lib/notifications/admin-notify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const channel = body.channel || 'all';

    let telegramResult: { success: boolean; error?: string } = { success: false, error: 'Telegram не настроен' };
    let emailResult: { success: boolean; error?: string } = { success: false, error: 'SMTP не настроен' };

    if (channel === 'telegram' || channel === 'all') {
      telegramResult = await sendTelegramAlert(
        `🚀 <b>[CRANSYS ТЕСТ СВЯЗИ]</b>\nТестовое оповещение администратора отправлено успешно! Система готова к боевой отправке сигналов об оплатах, регистрациях и аудитах.`,
        body.telegram
      );
    }

    if (channel === 'email' || channel === 'all') {
      emailResult = await sendEmailAlert(
        'Тест связи почтового шлюза Cransys',
        `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Тестовое оповещение Cransys</h2>
          <p style="color: #334155; font-size: 14px;">Почтовый шлюз настроен корректно и готов к отправке уведомлений об оплатах, аудитах и регистрации пользователей.</p>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Время отправки: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} (МСК)</p>
        </div>`,
        body.email
      );
    }

    return NextResponse.json({
      success: true,
      telegram: telegramResult,
      email: emailResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send test alert' },
      { status: 500 }
    );
  }
}
