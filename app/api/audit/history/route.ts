import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');

  // Если пользователь не авторизован — возвращаем пустую историю
  if (!userId) {
    return NextResponse.json({
      configured: true,
      reports: [],
      message: 'Для просмотра персональной истории войдите в аккаунт',
    });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      configured: false,
      reports: [],
      message: 'База данных не подключена',
    });
  }

  try {
    // Изоляция данных на уровне пользователя (Row-Level Security)
    const rows = await sql`
      SELECT 
        j.id,
        j.file_name as "fileName",
        j.created_at as "createdAt",
        j.status,
        r.tier,
        r.total_spend_rub as "totalSpendRub",
        r.total_loss_rub as "totalLossRub",
        r.overall_score as "overallScore",
        r.rules_summary as "rulesSummary"
      FROM public.audit_jobs j
      LEFT JOIN public.audit_reports r ON r.audit_job_id = j.id
      WHERE j.user_id = ${userId}
      ORDER BY j.created_at DESC
      LIMIT 50;
    `;

    return NextResponse.json({
      configured: true,
      reports: rows || [],
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

