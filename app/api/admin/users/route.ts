import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUsersAsync,
  createUser,
  updateUser,
  deleteUser,
  findUserById,
  findUserByEmail,
} from '@/lib/db/users-store';
import { UserTier, getTierConfig } from '@/lib/billing/tiers';
import { checkPasswordSecurity } from '@/lib/auth/password-validator';

export async function GET(req: NextRequest) {
  try {
    const users = await getAllUsersAsync();
    // Возвращаем список пользователей без паролей для безопасности
    const sanitized = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      tier: u.tier,
      hasPaid: u.hasPaid,
      reportsUsed: u.reportsUsed,
      reportsLimit: u.reportsLimit,
      isBlocked: u.isBlocked,
      revenue: u.revenue,
      createdAt: u.createdAt,
      lastActive: u.lastActive,
      emailVerified: u.emailVerified,
      agencyName: u.agencyName,
      agencyContact: u.agencyContact,
      agencyWebsite: u.agencyWebsite,
      customNotes: u.customNotes,
    }));

    return NextResponse.json({ success: true, users: sanitized });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при получении списка пользователей' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, tier, role, hasPaid } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

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

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    const newUser = await createUser({
      email,
      password,
      name: name || email.split('@')[0],
      tier: tier || 'EXPRESS_SINGLE',
      role: role || 'USER',
      hasPaid: hasPaid ?? true,
      emailVerified: true, // Администратор создает уже верифицированного пользователя
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error creating user by admin:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при создании пользователя' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      email,
      password,
      name,
      tier,
      reportsUsed,
      reportsLimit,
      isBlocked,
      revenue,
      emailVerified,
      agencyName,
      agencyContact,
      agencyWebsite,
      customNotes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID пользователя обязателен' },
        { status: 400 }
      );
    }

    const patch: any = {};
    if (email !== undefined) patch.email = email.trim().toLowerCase();
    if (password !== undefined && password.length >= 8) {
      const passwordCheck = checkPasswordSecurity(password);
      if (!passwordCheck.valid) {
        return NextResponse.json(
          { success: false, error: passwordCheck.errors.join('. ') },
          { status: 400 }
        );
      }
      patch.passwordHash = password;
    }
    if (name !== undefined) patch.name = name;
    if (tier !== undefined) {
      patch.tier = tier as UserTier;
      const config = getTierConfig(tier);
      if (reportsLimit === undefined) {
        patch.reportsLimit = config.reportsLimit;
      }
    }
    if (reportsUsed !== undefined) patch.reportsUsed = Math.max(0, Number(reportsUsed));
    if (reportsLimit !== undefined) patch.reportsLimit = Math.max(1, Number(reportsLimit));
    if (isBlocked !== undefined) patch.isBlocked = Boolean(isBlocked);
    if (revenue !== undefined) patch.revenue = Math.max(0, Number(revenue));
    if (emailVerified !== undefined) patch.emailVerified = Boolean(emailVerified);
    if (agencyName !== undefined) patch.agencyName = agencyName;
    if (agencyContact !== undefined) patch.agencyContact = agencyContact;
    if (agencyWebsite !== undefined) patch.agencyWebsite = agencyWebsite;
    if (customNotes !== undefined) patch.customNotes = customNotes;

    const updated = await updateUser(id, patch);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        tier: updated.tier,
        hasPaid: updated.hasPaid,
        reportsUsed: updated.reportsUsed,
        reportsLimit: updated.reportsLimit,
        isBlocked: updated.isBlocked,
        revenue: updated.revenue,
        createdAt: updated.createdAt,
        lastActive: updated.lastActive,
        emailVerified: updated.emailVerified,
        agencyName: updated.agencyName,
        agencyContact: updated.agencyContact,
        agencyWebsite: updated.agencyWebsite,
        customNotes: updated.customNotes,
      },
    });
  } catch (error) {
    console.error('Error updating user by admin:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при обновлении пользователя' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID пользователя обязателен' },
        { status: 400 }
      );
    }

    const target = await findUserById(id);
    if (target?.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Нельзя удалить главного администратора платформы' },
        { status: 403 }
      );
    }

    const success = await deleteUser(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Error deleting user by admin:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при удалении пользователя' },
      { status: 500 }
    );
  }
}
