import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, updateUser, generateVerificationCode } from '@/lib/db/users-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Укажите email' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const newCode = generateVerificationCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await updateUser(user.id, {
      verificationCode: newCode,
      verificationExpires: expires,
    });

    return NextResponse.json({
      success: true,
      message: 'Новый код подтверждения сгенерирован',
      verificationCode: newCode,
    });
  } catch (error) {
    console.error('Resend verification code error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка отправки кода' },
      { status: 500 }
    );
  }
}
