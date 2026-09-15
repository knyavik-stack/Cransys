import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/db/users-store';
import { getTierConfig, UserTier } from '@/lib/billing/tiers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Пожалуйста, укажите корректный адрес электронной почты' },
        { status: 400 }
      );
    }

    if (!password || password.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Пароль должен содержать не менее 5 символов' },
        { status: 400 }
      );
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Пользователь с таким email уже зарегистрирован. Пожалуйста, выполните вход или восстановите пароль.',
        },
        { status: 409 }
      );
    }

    const defaultTier: UserTier = 'EXPRESS_SINGLE';
    const newUser = createUser({
      email,
      password,
      name: name || email.split('@')[0],
      tier: defaultTier,
      role: 'USER',
      hasPaid: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Регистрация прошла успешно!',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        tier: newUser.tier,
        hasPaid: newUser.hasPaid,
        reportsUsed: newUser.reportsUsed,
        reportsLimit: newUser.reportsLimit,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера при регистрации' },
      { status: 500 }
    );
  }
}
