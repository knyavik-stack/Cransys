import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureDatabaseReady } from '@/db';

export async function GET(req: NextRequest) {
  try {
    // 1. Проверка Neon PostgreSQL
    let dbConnected = false;
    let dbLatencyMs = 0;
    try {
      const startTime = Date.now();
      const isReady = await ensureDatabaseReady();
      const sql = getDb();
      if (isReady && sql) {
        await (sql as any)`SELECT 1;`;
        dbConnected = true;
        dbLatencyMs = Date.now() - startTime;
      }
    } catch (e) {
      dbConnected = false;
    }

    // 2. Проверка секретов в окружении
    const secretsStatus = {
      // Yandex Direct OAuth
      YANDEX_CLIENT_ID: Boolean(process.env.YANDEX_CLIENT_ID),
      YANDEX_CLIENT_SECRET: Boolean(process.env.YANDEX_CLIENT_SECRET),
      YANDEX_REDIRECT_URI: Boolean(process.env.YANDEX_REDIRECT_URI),

      // PostgreSQL Database
      DATABASE_URL: Boolean(process.env.DATABASE_URL || process.env.PG_DATABASE_URL),

      // SMTP Mailer
      SMTP_HOST: Boolean(process.env.SMTP_HOST),
      SMTP_PORT: Boolean(process.env.SMTP_PORT),
      SMTP_USER: Boolean(process.env.SMTP_USER),
      SMTP_PASS: Boolean(process.env.SMTP_PASS),
      SMTP_FROM: Boolean(process.env.SMTP_FROM),

      // Admin & Security
      ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
      ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
      TEST_USER_EMAIL: Boolean(process.env.TEST_USER_EMAIL),
      TEST_USER_PASSWORD: Boolean(process.env.TEST_USER_PASSWORD),

      // YooKassa Payment
      YOOKASSA_SHOP_ID: Boolean(process.env.YOOKASSA_SHOP_ID),
      YOOKASSA_SECRET_KEY: Boolean(process.env.YOOKASSA_SECRET_KEY),
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        latencyMs: dbLatencyMs,
        provider: 'Neon Serverless PostgreSQL',
      },
      secrets: secretsStatus,
    });
  } catch (error) {
    console.error('Error checking system status:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при проверке статуса системы' },
      { status: 500 }
    );
  }
}
