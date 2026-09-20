import nodemailer from 'nodemailer';

export interface TelegramNotificationResult {
  success: boolean;
  error?: string;
}

export interface EmailNotificationResult {
  success: boolean;
  error?: string;
}

/**
 * Отправка сообщения в Telegram Администратору через Telegram Bot API
 */
export async function sendTelegramAdminNotification(textHtml: string): Promise<TelegramNotificationResult> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '').trim();

  if (!botToken || !chatId) {
    return {
      success: false,
      error: 'TELEGRAM_BOT_TOKEN или TELEGRAM_ADMIN_CHAT_ID не настроены в переменных окружения',
    };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: textHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        success: false,
        error: data?.description || `Telegram API HTTP ${res.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Сетевая ошибка Telegram API';
    console.warn('Telegram notification failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Отправка служебного email уведомления Администратору
 */
export async function sendAdminEmailNotification(subject: string, htmlContent: string): Promise<EmailNotificationResult> {
  const host = (process.env.SMTP_HOST || 'smtp.yandex.ru').trim();
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = (process.env.SMTP_USER || '').trim().replace(/^['"]|['"]$/g, '');
  const pass = (process.env.SMTP_PASS || '').trim().replace(/^['"]|['"]$/g, '');
  const adminEmail = (process.env.ADMIN_EMAIL || user || 'admin@cransys.ru').trim();

  if (!user || !pass || !adminEmail) {
    return {
      success: false,
      error: 'SMTP настройки или ADMIN_EMAIL не указаны',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 4000,
      socketTimeout: 5000,
      tls: { rejectUnauthorized: false },
    });

    const from = process.env.SMTP_FROM || `Cransys Alerts <${user}>`;

    await transporter.sendMail({
      from,
      to: adminEmail,
      subject: `[Cransys Alert] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #1e293b;">
          <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #38bdf8; margin: 0; font-size: 18px;">⚡ Уведомление платформы Cransys</h2>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">${new Date().toLocaleString('ru-RU')}</div>
          </div>
          <div style="line-height: 1.6; font-size: 14px; color: #e2e8f0;">
            ${htmlContent}
          </div>
          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center;">
            Cransys Analytics Headquarter • Автоматическая система мониторинга
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'SMTP ошибка';
    console.warn('Admin email notification failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Сквозное уведомление по всем доступным каналам (Telegram + Email)
 */
export async function notifyAdmin(payload: {
  title: string;
  telegramText: string;
  emailHtml: string;
}): Promise<{ telegram: TelegramNotificationResult; email: EmailNotificationResult }> {
  const [tgRes, emRes] = await Promise.all([
    sendTelegramAdminNotification(payload.telegramText),
    sendAdminEmailNotification(payload.title, payload.emailHtml),
  ]);

  return { telegram: tgRes, email: emRes };
}

/**
 * Оповещение о новой оплате (ЮKassa / Тариф)
 */
export async function notifyNewPayment(data: {
  amount: number;
  tierName: string;
  userEmail: string;
  userName?: string;
  paymentId: string;
}) {
  const formattedAmount = data.amount.toLocaleString('ru-RU');
  const tgText = `💰 <b>НОВАЯ ОПЛАТА ТАРИФА!</b>\n\n` +
    `💳 <b>Тариф:</b> ${data.tierName}\n` +
    `💵 <b>Сумма:</b> ${formattedAmount} ₽\n` +
    `👤 <b>Клиент:</b> ${data.userName || 'Не указано'} (${data.userEmail})\n` +
    `🆔 <b>ID платежа:</b> <code>${data.paymentId}</code>\n` +
    `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;

  const emailHtml = `
    <p>Зафиксирована успешная оплата тарифа на платформе:</p>
    <ul>
      <li><b>Тариф:</b> <span style="color: #38bdf8;">${data.tierName}</span></li>
      <li><b>Сумма:</b> <span style="color: #4ade80; font-weight: bold;">${formattedAmount} ₽</span></li>
      <li><b>Пользователь:</b> ${data.userName || '—'} (${data.userEmail})</li>
      <li><b>Идентификатор платежа:</b> <code>${data.paymentId}</code></li>
    </ul>
    <p><a href="https://cransys.ru/admin" style="display: inline-block; background: #2563eb; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold;">Перейти в Панель Администратора</a></p>
  `;

  return notifyAdmin({
    title: `Новая оплата: ${formattedAmount} ₽ (${data.tierName})`,
    telegramText: tgText,
    emailHtml,
  });
}

/**
 * Оповещение о новой регистрации
 */
export async function notifyNewRegistration(data: {
  email: string;
  name: string;
  tier: string;
}) {
  const tgText = `👤 <b>НОВАЯ РЕГИСТРАЦИЯ</b>\n\n` +
    `📛 <b>Имя:</b> ${data.name}\n` +
    `📧 <b>Email:</b> ${data.email}\n` +
    `🏷️ <b>Тариф:</b> ${data.tier}\n` +
    `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;

  const emailHtml = `
    <p>Новый пользователь зарегистрировался в системе:</p>
    <ul>
      <li><b>Имя:</b> ${data.name}</li>
      <li><b>Email:</b> ${data.email}</li>
      <li><b>Тариф по умолчанию:</b> ${data.tier}</li>
    </ul>
  `;

  return notifyAdmin({
    title: `Новый пользователь: ${data.name} (${data.email})`,
    telegramText: tgText,
    emailHtml,
  });
}

/**
 * Оповещение о завершении аудита
 */
export async function notifyAuditCompleted(data: {
  userEmail?: string;
  sourceType: string;
  totalSpend: number;
  totalLoss: number;
  score: number;
  fileName?: string;
}) {
  const tgText = `🚀 <b>ПРОВЕДЕН АУДИТ КАМПАНИЙ</b>\n\n` +
    `👤 <b>Пользователь:</b> ${data.userEmail || 'Гостевой аудит'}\n` +
    `📊 <b>Индекс здоровья:</b> ${data.score}/100\n` +
    `💸 <b>Слив бюджета:</b> ${data.totalLoss.toLocaleString('ru-RU')} ₽ (из ${data.totalSpend.toLocaleString('ru-RU')} ₽)\n` +
    `📁 <b>Источник:</b> ${data.sourceType} ${data.fileName ? `(${data.fileName})` : ''}\n` +
    `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;

  const emailHtml = `
    <p>Успешно рассчитан аудит рекламных кампаний Директа:</p>
    <ul>
      <li><b>Пользователь:</b> ${data.userEmail || 'Гость'}</li>
      <li><b>Индекс качества:</b> <b>${data.score}/100</b></li>
      <li><b>Обнаружен нецелевой слив:</b> <span style="color: #f87171; font-weight: bold;">${data.totalLoss.toLocaleString('ru-RU')} ₽</span></li>
      <li><b>Общий расход:</b> ${data.totalSpend.toLocaleString('ru-RU')} ₽</li>
      <li><b>Источник:</b> ${data.sourceType}</li>
    </ul>
  `;

  return notifyAdmin({
    title: `Аудит завершен: Слив ${data.totalLoss.toLocaleString('ru-RU')} ₽ (Оценка ${data.score}/100)`,
    telegramText: tgText,
    emailHtml,
  });
}
