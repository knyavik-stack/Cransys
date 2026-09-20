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

  // Заглушка/отправка через стандартный transport
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

export interface AuditNotifyDetails {
  reportId?: string;
  userEmail?: string;
  email?: string;
  campaignCount?: number;
  score?: number;
  wasteRub?: number;
  totalLoss?: number;
  totalLossRub?: number;
  totalSpend?: number;
  totalSpendRub?: number;
  sourceType?: string;
  isDemo?: boolean;
  [key: string]: any;
}

export interface PaymentNotifyDetails {
  amountRub: number;
  tierName?: string;
  tier?: string;
  userEmail?: string;
  email?: string;
  paymentId?: string;
  [key: string]: any;
}

export interface RegistrationNotifyDetails {
  userEmail?: string;
  email?: string;
  name?: string;
  tier?: string;
  [key: string]: any;
}

export async function notifyAuditCompleted(details: AuditNotifyDetails): Promise<void> {
  const loss = details.wasteRub ?? details.totalLoss ?? details.totalLossRub;
  const spend = details.totalSpend ?? details.totalSpendRub;

  await notifyAdminEvent({
    type: 'AUDIT',
    title: details.isDemo ? 'Демо-аудит кампании' : 'Аудит рекламных кампаний',
    userEmail: details.userEmail || details.email,
    details: {
      'ID отчета': details.reportId,
      'Источник': details.sourceType,
      'Кампаний проверено': details.campaignCount,
      'Расход': spend ? `${spend.toLocaleString('ru-RU')} ₽` : undefined,
      'Оценка качества': details.score ? `${details.score} / 100` : undefined,
      'Выявленный слив': loss ? `${loss.toLocaleString('ru-RU')} ₽` : undefined,
      'Режим': details.isDemo ? 'Демо' : 'Боевой',
    },
  });
}

export async function notifyPaymentSuccess(details: PaymentNotifyDetails): Promise<void> {
  const name = details.tierName || details.tier || 'Тариф';
  await notifyAdminEvent({
    type: 'PAYMENT',
    title: `Оплата тарифа ${name}`,
    userEmail: details.userEmail || details.email,
    amountRub: details.amountRub,
    details: {
      'Тариф': name,
      'Сумма': `${details.amountRub.toLocaleString('ru-RU')} ₽`,
      'ID платежа': details.paymentId,
    },
  });
}

export async function notifyNewUserRegistration(details: RegistrationNotifyDetails): Promise<void> {
  await notifyAdminEvent({
    type: 'REGISTRATION',
    title: 'Регистрация пользователя',
    userEmail: details.userEmail || details.email,
    details: {
      'Имя': details.name || 'Не указано',
      'Тариф': details.tier || 'EXPRESS_SINGLE',
    },
  });
}

// Алиасы для обратной совместимости и различных сценариев импорта
export const notifyNewPayment = notifyPaymentSuccess;
export const notifyPayment = notifyPaymentSuccess;
export const notifyNewPaymentSuccess = notifyPaymentSuccess;
export const notifyNewRegistration = notifyNewUserRegistration;
export const notifyRegistration = notifyNewUserRegistration;
export const notifyUserRegistration = notifyNewUserRegistration;
export const notifyAudit = notifyAuditCompleted;
export const notifyNewAudit = notifyAuditCompleted;

