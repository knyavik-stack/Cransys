import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      hasSmtpUser: Boolean(process.env.SMTP_USER),
      smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***@***` : 'НЕ ЗАДАН',
      hasSmtpPass: Boolean(process.env.SMTP_PASS),
      smtpHost: process.env.SMTP_HOST || 'smtp.yandex.ru (default)',
      smtpPort: process.env.SMTP_PORT || '465 (default)',
      hasYandexClientId: Boolean(process.env.YANDEX_CLIENT_ID),
      yandexClientIdLength: process.env.YANDEX_CLIENT_ID ? process.env.YANDEX_CLIENT_ID.length : 0,
      hasYandexClientSecret: Boolean(process.env.YANDEX_CLIENT_SECRET),
      yandexClientSecretLength: process.env.YANDEX_CLIENT_SECRET ? process.env.YANDEX_CLIENT_SECRET.length : 0,
      yandexRedirectUri: process.env.YANDEX_REDIRECT_URI || 'Не задан (будет определен динамически)',
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    },
    smtpConnectionTest: {
      status: 'PENDING',
      message: '',
    },
  };

  // Проверка соединения с Яндекс SMTP
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.yandex.ru',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: (Number(process.env.SMTP_PORT) || 465) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.verify();
      diagnostics.smtpConnectionTest.status = 'SUCCESS';
      diagnostics.smtpConnectionTest.message = 'Соединение с Яндекс SMTP успешно установлено и авторизовано!';
    } catch (err) {
      diagnostics.smtpConnectionTest.status = 'ERROR';
      diagnostics.smtpConnectionTest.message = err instanceof Error ? err.message : 'Неизвестная ошибка SMTP';
    }
  } else {
    diagnostics.smtpConnectionTest.status = 'SKIPPED';
    diagnostics.smtpConnectionTest.message = 'SMTP_USER или SMTP_PASS не найдены в переменных окружения.';
  }

  return NextResponse.json(diagnostics);
}
