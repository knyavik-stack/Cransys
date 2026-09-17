import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, updateUser } from '@/lib/db/users-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email обязателен для входа' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Пожалуйста, введите пароль' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(trimmedEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким email не найден. Проверьте адрес или зарегистрируйтесь.' },
        { status: 404 }
      );
    }

    // Проверка блокировки пользователя администратором
    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ваш аккаунт заблокирован администратором платформы. Обратитесь в службу поддержки: support@cransys.ru',
        },
        { status: 403 }
      );
    }

    // Строгая проверка пароля
    if (user.passwordHash !== password) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль. Пожалуйста, проверьте раскладку клавиатуры или восстановите пароль.' },
        { status: 401 }
      );
    }

    // Обновляем активность и дату последнего входа
    await updateUser(user.id, { lastActive: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
        hasPaid: user.hasPaid,
        reportsUsed: user.reportsUsed,
        reportsLimit: user.reportsLimit,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
        agencyName: user.agencyName,
        agencyContact: user.agencyContact,
        agencyWebsite: user.agencyWebsite,
        customNotes: user.customNotes,
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
