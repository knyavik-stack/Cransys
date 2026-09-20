/**
 * Модуль отправки критических уведомлений администратору и собственнику
 * Каналы: Telegram Bot API + SMTP (Yandex/Корпоративная почта)
 */

import nodemailer from 'nodemailer';
import { fetchSiteSettingsAsync } from '@/lib/db/site-settings-store';

export interface AdminAlertPayload {
  type: 'PAYMENT' | 'REGISTRATION' | 'AUDIT' | 'SYSTEM_ERROR';
  title: string;
  details?: Record<string, string | number | boolean | undefined>;
  userEmail?: string;
  amountRub?: number;
}

export async function sendTelegramAlert(
  message: string,
  overrideConfig?: { botToken?: string; chatId?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await fetchSiteSettingsAsync();
    const tgConfig = settings.notifications?.telegram;

    const token = overrideConfig?.botToken || tgConfig?.botToken || process.env.TELEGRAM_ADMIN_BOT_TOKEN;
    const chatId = overrideConfig?.chatId || tgConfig?.chatId || process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || !chatId) {
      return { success: false, error: 'Telegram credentials не заданы (укажите Bot Token и Chat ID в админке)' };
    }

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
      return { success: false, error: data.description || 'Ошибка Telegram API' };
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error sending Telegram alert:', error);
    return { success: false, error: error?.message || 'Сбой сети при отправке в Telegram' };
  }
}

export async function sendEmailAlert(
  subject: string,
  htmlContent: string,
  overrideConfig?: { smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPass?: string; alertEmail?: string; smtpFrom?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await fetchSiteSettingsAsync();
    const emailConfig = settings.notifications?.email;

    const host = overrideConfig?.smtpHost || emailConfig?.smtpHost || process.env.SMTP_HOST || 'smtp.yandex.ru';
    const port = overrideConfig?.smtpPort || emailConfig?.smtpPort || Number(process.env.SMTP_PORT) || 465;
    const user = (overrideConfig?.smtpUser || emailConfig?.smtpUser || process.env.SMTP_USER || '').trim();
    const pass = (overrideConfig?.smtpPass || emailConfig?.smtpPass || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').trim();
    const to = overrideConfig?.alertEmail || emailConfig?.alertEmail || process.env.ADMIN_ALERT_EMAIL || user;
    const from = overrideConfig?.smtpFrom || emailConfig?.smtpFrom || process.env.SMTP_FROM || `Cransys <${user || 'cransys@yandex.ru'}>`;

    if (!user || !pass || !to) {
      return { success: false, error: 'SMTP настройки не заданы (укажите SMTP логин, пароль и email получателя в админке)' };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from,
      to,
      subject: `[Cransys] ${subject}`,
      html: htmlContent,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending email alert:', error);
    return { success: false, error: error?.message || 'Сбой отправки email через SMTP' };
  }
}

export async function notifyAdminEvent(payload: AdminAlertPayload): Promise<void> {
  const settings = await fetchSiteSettingsAsync();
  const tg = settings.notifications?.telegram;
  const em = settings.notifications?.email;

  const timeStr = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  let text = `<b>[CRANSYS NOTIFICATION]</b>\n`;
  text += `📅 <i>${timeStr} (МСК)</i>\n\n`;

  let htmlBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">`;
  htmlBody += `<h2 style="color: #0f172a; margin-top: 0;">Уведомление платформы Cransys</h2>`;
  htmlBody += `<p style="color: #64748b; font-size: 13px;">Время события: <strong>${timeStr} (МСК)</strong></p>`;

  if (payload.type === 'PAYMENT') {
    text += `💰 <b>НОВАЯ ОПЛАТА ТАРИФА!</b>\n`;
    text += `Сумма: <b>${payload.amountRub?.toLocaleString('ru-RU')} ₽</b>\n`;
    text += `Клиент: <code>${payload.userEmail || '—'}</code>\n`;

    htmlBody += `<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; margin: 15px 0;">`;
    htmlBody += `<p style="margin: 0; font-size: 16px; font-weight: bold; color: #166534;">Новая оплата тарифа: ${payload.amountRub?.toLocaleString('ru-RU')} ₽</p>`;
    htmlBody += `<p style="margin: 5px 0 0 0; color: #15803d;">Пользователь: <strong>${payload.userEmail || '—'}</strong></p>`;
    htmlBody += `</div>`;
  } else if (payload.type === 'REGISTRATION') {
    text += `👤 <b>НОВАЯ РЕГИСТРАЦИЯ</b>\n`;
    text += `Email: <code>${payload.userEmail || '—'}</code>\n`;

    htmlBody += `<div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; margin: 15px 0;">`;
    htmlBody += `<p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e40af;">Новый зарегистрированный пользователь</p>`;
    htmlBody += `<p style="margin: 5px 0 0 0; color: #1d4ed8;">Email: <strong>${payload.userEmail || '—'}</strong></p>`;
    htmlBody += `</div>`;
  } else if (payload.type === 'AUDIT') {
    text += `⚡ <b>ЗАВЕРШЕН АУДИТ КАМПАНИЙ</b>\n`;
    text += `Клиент: <code>${payload.userEmail || 'Гость'}</code>\n`;

    htmlBody += `<div style="background-color: #faf5ff; border-left: 4px solid #9333ea; padding: 12px; margin: 15px 0;">`;
    htmlBody += `<p style="margin: 0; font-size: 16px; font-weight: bold; color: #6b21a8;">Завершен экспресс-аудит кампаний</p>`;
    htmlBody += `<p style="margin: 5px 0 0 0; color: #7e22ce;">Клиент: <strong>${payload.userEmail || 'Гость'}</strong></p>`;
    htmlBody += `</div>`;
  } else {
    text += `⚠️ <b>${payload.title}</b>\n`;
    htmlBody += `<p style="font-size: 16px; font-weight: bold; color: #dc2626;">${payload.title}</p>`;
  }

  if (payload.details) {
    text += `\n<b>Детали:</b>\n`;
    htmlBody += `<table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">`;
    Object.entries(payload.details).forEach(([k, v]) => {
      if (v !== undefined) {
        text += `• ${k}: <code>${v}</code>\n`;
        htmlBody += `<tr><td style="padding: 6px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">${k}</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a; border-bottom: 1px solid #f1f5f9; text-align: right;">${v}</td></tr>`;
      }
    });
    htmlBody += `</table>`;
  }

  htmlBody += `<p style="margin-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">Это служебное уведомление администратора системы Cransys Analytics.</p>`;
  htmlBody += `</div>`;

  // Определение необходимости отправки в Telegram
  const shouldSendTg =
    tg?.enabled !== false &&
    (payload.type === 'PAYMENT' ? tg?.notifyOnPayment !== false :
     payload.type === 'REGISTRATION' ? tg?.notifyOnRegistration !== false :
     payload.type === 'AUDIT' ? tg?.notifyOnAudit !== false :
     tg?.notifyOnSystemError !== false);

  if (shouldSendTg) {
    await sendTelegramAlert(text);
  }

  // Определение необходимости отправки в Email
  const shouldSendEmail =
    em?.enabled === true &&
    (payload.type === 'PAYMENT' ? em?.notifyOnPayment !== false :
     payload.type === 'REGISTRATION' ? em?.notifyOnRegistration !== false :
     payload.type === 'AUDIT' ? em?.notifyOnAudit === true :
     false);

  if (shouldSendEmail) {
    await sendEmailAlert(payload.title, htmlBody);
  }
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

