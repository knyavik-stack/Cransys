import { NextRequest, NextResponse } from 'next/server';
import { getUserAuditHistory } from '@/lib/db/audit-store';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const userEmail = req.headers.get('x-user-email');

  // Если пользователь не авторизован — возвращаем пустую историю с подсказкой
  if (!userId && !userEmail) {
    return NextResponse.json({
      configured: true,
      reports: [],
      message: 'Для просмотра персональной истории войдите в аккаунт',
    });
  }

  try {
    const reports = await getUserAuditHistory({ userId, userEmail });

    return NextResponse.json({
      configured: true,
      reports,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Ошибка получения истории';
    return NextResponse.json({
      configured: true,
      reports: [],
      error: msg,
    });
  }
}
