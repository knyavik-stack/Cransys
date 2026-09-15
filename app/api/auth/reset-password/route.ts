import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, updateUser } from '@/lib/db/users-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Укажите корректный адрес электронной почты' },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким email не найден в системе' },
        { status: 404 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, error: 'Аккаунт заблокирован. Восстановление пароля недоступно.' },
        { status: 403 }
      );
    }

    if (!newPassword || newPassword.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Новый пароль должен содержать минимум 5 символов' },
        { status: 400 }
      );
    }

    updateUser(user.id, { passwordHash: newPassword });

    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменен! Теперь вы можете войти в аккаунт с новым паролем.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при сбросе пароля' },
      { status: 500 }
    );
  }
}
