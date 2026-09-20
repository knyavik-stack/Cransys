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
        `🚀 <b>[CRANSYS ТЕСТ СВЯЗИ]</b>\nТестовое оповещение администратора отправлено успешно!`
      );
    }

    if (channel === 'email' || channel === 'all') {
      emailResult = await sendEmailAlert(
        'Тест связи Cransys',
        '<p>Тестовое оповещение администратора отправлено успешно.</p>'
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
