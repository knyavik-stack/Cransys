import { NextRequest, NextResponse } from 'next/server';
import { verifyUserEmailCode } from '@/lib/db/users-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Укажите email и код подтверждения' },
        { status: 400 }
      );
    }

    const result = await verifyUserEmailCode(email, code);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Неверный или просроченный код' },
        { status: 400 }
      );
    }

    const u = result.user;
    return NextResponse.json({
      success: true,
      message: 'Email успешно подтвержден!',
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        tier: u.tier,
        hasPaid: u.hasPaid,
        reportsUsed: u.reportsUsed,
        reportsLimit: u.reportsLimit,
        createdAt: u.createdAt,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка при проверке кода' },
      { status: 500 }
    );
  }
}
