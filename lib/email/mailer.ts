import nodemailer from 'nodemailer';

interface SendVerificationEmailOptions {
  to: string;
  code: string;
  name?: string;
}

interface SendPasswordResetEmailOptions {
  to: string;
  code?: string;
  name?: string;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter(): ReturnType<typeof nodemailer.createTransport> | null {
  const host = (process.env.SMTP_HOST || 'smtp.yandex.ru').trim();
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = (process.env.SMTP_USER || '').trim().replace(/^['"]|['"]$/g, '');
  const pass = (process.env.SMTP_PASS || '').trim().replace(/^['"]|['"]$/g, '');

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      connectionTimeout: 4000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return transporter;
}

/**
 * Отправка одноразового 6-значного кода подтверждения email при регистрации
 */
export async function sendVerificationEmail({ to, code, name }: SendVerificationEmailOptions): Promise<{ success: boolean; error?: string }> {
  const mailTransporter = getTransporter();
  const from = process.env.SMTP_FROM || `Cransys <${process.env.SMTP_USER || 'cransys@yandex.ru'}>`;
  const greeting = name ? `Здравствуйте, ${name}!` : 'Здравствуйте!';

  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="utf-8">
      <title>Подтверждение регистрации в Cransys</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; }
        .logo span { color: #059669; }
        .code-box { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; margin: 24px 0; font-family: monospace; }
        .footer { font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">CRANSYS <span>AUDIT</span></div>
        <p style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${greeting}</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Вы зарегистрировали аккаунт в сервисе независимого аудита рекламных кампаний Яндекс.Директ. 
          Для завершения регистрации и защиты учетной записи введите код подтверждения:
        </p>
        <div class="code-box">${code}</div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Код действует 15 минут. Если вы не регистрировались на сайте Cransys, просто проигнорируйте это письмо.
        </p>
        <div class="footer">
          © 2026 Cransys. Независимый аудит рекламного бюджета без предвзятости.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!mailTransporter) {
    console.warn(`[MAILER] SMTP credentials not set (SMTP_USER/SMTP_PASS). Email to ${to} with code ${code} logged to console only.`);
    return { success: true };
  }

  try {
    await mailTransporter.sendMail({
      from,
      to,
      subject: `${code} — Код подтверждения регистрации в Cransys`,
      text: `${greeting}\n\nВаш код подтверждения для входа в Cransys: ${code}\n\nКод действует 15 минут.`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('[MAILER] Error sending email via Yandex SMTP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка отправки почты',
    };
  }
}

/**
 * Отправка оповещения об успешном сбросе пароля
 */
export async function sendPasswordChangedEmail({ to, name }: { to: string; name?: string }): Promise<{ success: boolean; error?: string }> {
  const mailTransporter = getTransporter();
  const from = process.env.SMTP_FROM || `Cransys <${process.env.SMTP_USER || 'cransys@yandex.ru'}>`;

  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="utf-8">
      <title>Пароль изменен | Cransys</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; }
        .logo { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 24px; }
        .logo span { color: #059669; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">CRANSYS <span>AUDIT</span></div>
        <p style="font-size: 16px; font-weight: 600;">Здравствуйте${name ? `, ${name}` : ''}!</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Пароль от вашей учетной записи Cransys был успешно изменен.
        </p>
        <p style="font-size: 13px; color: #e11d48; line-height: 1.5; font-weight: 500;">
          Если вы не совершали данное действие, немедленно обратитесь в службу поддержки: cransys@yandex.ru.
        </p>
      </div>
    </body>
    </html>
  `;

  if (!mailTransporter) return { success: true };

  try {
    await mailTransporter.sendMail({
      from,
      to,
      subject: 'Безопасность Cransys: Пароль вашей учетной записи изменен',
      text: `Здравствуйте!\n\nПароль от вашей учетной записи Cransys был успешно изменен.\nЕсли это были не вы, свяжитесь с поддержкой.`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('[MAILER] Error sending password changed email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Ошибка отправки' };
  }
}
