import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser, generateVerificationCode } from '@/lib/db/users-store';
import { checkPasswordSecurity } from '@/lib/auth/password-validator';
import { UserTier } from '@/lib/billing/tiers';
import { sendVerificationEmail } from '@/lib/email/mailer';
import { recordTelemetryEvent } from '@/lib/db/telemetry-store';

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

    const normalizedEmail = email.trim().toLowerCase();

    // Проверка требований безопасности пароля
    const passwordCheck = checkPasswordSecurity(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: passwordCheck.errors.join('. '),
          rules: passwordCheck.rules,
        },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing && existing.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Пользователь с таким email уже зарегистрирован. Пожалуйста, выполните вход или восстановите пароль.',
        },
        { status: 409 }
      );
    }

    const defaultTier: UserTier = 'EXPRESS_SINGLE';
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const newUser = await createUser({
      email: normalizedEmail,
      password,
      name: (name || normalizedEmail.split('@')[0]).trim(),
      tier: defaultTier,
      role: 'USER',
      hasPaid: false,
      emailVerified: false,
      verificationCode,
      verificationExpires,
    });

    // Отправка реального письма через Яндекс SMTP
    const mailResult = await sendVerificationEmail({
      to: normalizedEmail,
      code: verificationCode,
      name: newUser.name,
    });

    // Фиксация события регистрации в телеметрии
    try {
      await recordTelemetryEvent({
        visitorId: `vis_${newUser.id.substring(0, 12)}`,
        userId: newUser.id,
        eventName: 'auth_registered',
        pagePath: '/sign-up',
        metadata: { role: newUser.role, tier: newUser.tier },
        userAgent: req.headers.get('user-agent'),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Код подтверждения отправлен на почту ${email}. Пожалуйста, проверьте входящие (или папку «Спам»).`,
      requiresVerification: true,
      verificationCode,
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
        emailVerified: newUser.emailVerified,
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
