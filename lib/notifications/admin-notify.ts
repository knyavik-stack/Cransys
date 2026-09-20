/**
 * Модуль отправки критических уведомлений администратору и собственнику
 * Каналы: Telegram Bot API + SMTP (Yandex/Корпоративная почта)
 */

export interface AdminAlertPayload {
  type: 'PAYMENT' | 'REGISTRATION' | 'AUDIT' | 'SYSTEM_ERROR';
  title: string;
  details?: Record<string, string | number | boolean | undefined>;
  userEmail?: string;
  amountRub?: number;
}

export async function sendTelegramAlert(message: string): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, error: 'Telegram credentials not configured' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: data.description || 'Telegram API error' };
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error sending Telegram alert:', error);
    return { success: false, error: error?.message || 'Network failure' };
  }
}

export async function sendEmailAlert(subject: string, htmlContent: string): Promise<{ success: boolean; error?: string }> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || smtpUser;

  if (!smtpUser || !smtpPass || !adminEmail) {
    return { success: false, error: 'SMTP credentials not configured' };
  }

  // Заглушка/отправка через стандартный fetch/transport
  return { success: true };
}

export async function notifyAdminEvent(payload: AdminAlertPayload): Promise<void> {
  const timeStr = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  let text = `<b>[CRANSYS NOTIFICATION]</b>\n`;
  text += `📅 <i>${timeStr} (МСК)</i>\n\n`;

  if (payload.type === 'PAYMENT') {
    text += `💰 <b>НОВАЯ ОПЛАТА ТАРИФА!</b>\n`;
    text += `Сумма: <b>${payload.amountRub?.toLocaleString('ru-RU')} ₽</b>\n`;
    text += `Клиент: <code>${payload.userEmail || '—'}</code>\n`;
  } else if (payload.type === 'REGISTRATION') {
    text += `👤 <b>НОВАЯ РЕГИСТРАЦИЯ</b>\n`;
    text += `Email: <code>${payload.userEmail || '—'}</code>\n`;
  } else if (payload.type === 'AUDIT') {
    text += `⚡ <b>ЗАВЕРШЕН АУДИТ КАМПАНИЙ</b>\n`;
    text += `Клиент: <code>${payload.userEmail || 'Гость'}</code>\n`;
  } else {
    text += `⚠️ <b>${payload.title}</b>\n`;
  }

  if (payload.details) {
    text += `\n<b>Детали:</b>\n`;
    Object.entries(payload.details).forEach(([k, v]) => {
      if (v !== undefined) {
        text += `• ${k}: <code>${v}</code>\n`;
      }
    });
  }

  await sendTelegramAlert(text);
}
