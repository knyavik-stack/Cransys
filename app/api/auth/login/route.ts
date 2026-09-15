import { NextRequest, NextResponse } from 'next/server';
import { getTierConfig, UserTier } from '@/lib/billing/tiers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email обязателен для входа' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@cransys.ru').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminCransys2026!';

    const testUserEmail = (process.env.TEST_USER_EMAIL || 'test-owner@cransys-audit.ru').toLowerCase();
    const testUserPassword = process.env.TEST_USER_PASSWORD || 'CransysTest2026!';

    // 1. Проверка Администратора
    if (trimmedEmail === adminEmail) {
      if (password && password !== adminPassword) {
        return NextResponse.json(
          { success: false, error: 'Неверный пароль администратора' },
          { status: 401 }
        );
      }

      const corpConfig = getTierConfig('CORP');
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin_root_master',
          email: adminEmail,
          name: 'Главный Администратор',
          role: 'ADMIN',
          tier: 'CORP' as UserTier,
          reportsUsed: 0,
          reportsLimit: corpConfig.reportsLimit,
          createdAt: '2026-01-01T00:00:00.000Z',
          agencyName: 'Cransys Analytics Headquarter',
        },
      });
    }

    // 2. Проверка Тестового аккаунта владельца
    if (trimmedEmail === testUserEmail) {
      if (password && password !== testUserPassword) {
        return NextResponse.json(
          { success: false, error: 'Неверный пароль тестового аккаунта' },
          { status: 401 }
        );
      }

      const maxConfig = getTierConfig('MAX');
      return NextResponse.json({
        success: true,
        user: {
          id: 'test_owner_account',
          email: testUserEmail,
          name: 'Тестовый аккаунт (Собственник)',
          role: 'TESTER_ADMIN',
          tier: 'MAX' as UserTier,
          reportsUsed: 2,
          reportsLimit: maxConfig.reportsLimit,
          agencyName: 'Digital Direct Agency',
          agencyContact: '@direct_expert / +7 (999) 000-00-00',
          agencyWebsite: 'https://agency-direct.ru',
          createdAt: new Date().toISOString(),
        },
      });
    }

    // 3. Обычный пользователь
    const defaultTier: UserTier = 'EXPRESS_PACK';
    const config = getTierConfig(defaultTier);

    return NextResponse.json({
      success: true,
      user: {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: trimmedEmail,
        name: name || trimmedEmail.split('@')[0] || 'Пользователь',
        role: 'USER',
        tier: defaultTier,
        reportsUsed: 0,
        reportsLimit: config.reportsLimit,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при авторизации' },
      { status: 500 }
    );
  }
}
