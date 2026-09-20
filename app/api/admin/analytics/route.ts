import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersAsync } from '@/lib/db/users-store';
import { getTelemetryEvents, calculateFunnelStats } from '@/lib/db/telemetry-store';
import { getAllDirectConnections } from '@/lib/db/direct-connections-store';
import { TIER_CONFIGS, UserTier } from '@/lib/billing/tiers';
import { getDb, ensureDatabaseReady } from '@/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';

    const users = await getAllUsersAsync();
    const telemetry = await getTelemetryEvents();
    const connections = await getAllDirectConnections();
    const funnelStats = await calculateFunnelStats(
      ['today', '7d', '30d', '90d', 'all'].includes(period)
        ? (period as 'today' | '7d' | '30d' | '90d' | 'all')
        : '7d'
    );

    // Временные рамки для расчета
    const now = new Date();
    let startDate = new Date(0);
    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    // 1. Фильтрация пользователей по периоду
    const periodUsers = users.filter((u) => new Date(u.createdAt) >= startDate);
    const paidUsers = users.filter((u) => u.hasPaid || (u.reportsLimit && u.reportsLimit > 1));

    // Расчет общей и периодической выручки по тарифам
    let totalRevenueRub = 0;
    let periodRevenueRub = 0;

    users.forEach((u) => {
      const tierConfig = TIER_CONFIGS[u.tier as UserTier];
      const tierPrice = tierConfig?.price || 0;
      if (u.hasPaid || tierPrice > 0) {
        totalRevenueRub += tierPrice;
        if (new Date(u.createdAt) >= startDate) {
          periodRevenueRub += tierPrice;
        }
      }
    });

    // 2. Расчет аудитов и найденного слива бюджета из телеметрии и БД
    let totalAuditsCount = 0;
    let periodAuditsCount = 0;
    let totalLossDetectedRub = 0;
    let totalSpendAnalyzedRub = 0;
    let totalScoresSum = 0;
    let scoresCount = 0;

    const auditEvents = telemetry.filter(
      (e) => e.eventName === 'audit_completed' || e.eventName === 'audit_init'
    );

    auditEvents.forEach((e) => {
      totalAuditsCount++;
      const eventTime = e.createdAt ? new Date(e.createdAt) : new Date();
      if (eventTime >= startDate) {
        periodAuditsCount++;
      }
      if (e.metadata) {
        if (e.metadata.wasteRub) {
          totalLossDetectedRub += Number(e.metadata.wasteRub) || 0;
        }
        if (e.metadata.budgetRub) {
          totalSpendAnalyzedRub += Number(e.metadata.budgetRub) || 0;
        }
        if (e.metadata.score) {
          totalScoresSum += Number(e.metadata.score) || 0;
          scoresCount++;
        }
      }
    });

    // Попытка обогатить данными из PostgreSQL если доступна таблица audit_reports
    const sql = getDb();
    if (sql) {
      try {
        await ensureDatabaseReady();
        const dbAudits = await sql`
          SELECT 
            COUNT(*)::int as total_count,
            COALESCE(SUM(waste_rub), 0)::bigint as total_waste,
            COALESCE(SUM(spend_rub), 0)::bigint as total_spend,
            COALESCE(AVG(health_score), 0)::int as avg_score
          FROM public.audit_reports;
        `;
        if (dbAudits && dbAudits[0] && Number(dbAudits[0].total_count) > 0) {
          totalAuditsCount = Math.max(totalAuditsCount, Number(dbAudits[0].total_count));
          totalLossDetectedRub = Math.max(totalLossDetectedRub, Number(dbAudits[0].total_waste));
          totalSpendAnalyzedRub = Math.max(totalSpendAnalyzedRub, Number(dbAudits[0].total_spend));
          if (Number(dbAudits[0].avg_score) > 0) {
            totalScoresSum = Number(dbAudits[0].avg_score);
            scoresCount = 1;
          }
        }
      } catch (e) {
        console.warn('Could not query public.audit_reports for analytics, using telemetry:', e);
      }
    }

    const averageAuditScore = scoresCount > 0 ? Math.round(totalScoresSum / scoresCount) : 68;

    // 3. Распределение по тарифам
    const tierCounts: Record<string, { count: number; revenue: number }> = {};
    Object.keys(TIER_CONFIGS).forEach((t) => {
      tierCounts[t] = { count: 0, revenue: 0 };
    });

    users.forEach((u) => {
      const t = u.tier || 'EXPRESS_SINGLE';
      if (!tierCounts[t]) {
        tierCounts[t] = { count: 0, revenue: 0 };
      }
      tierCounts[t].count++;
      const config = TIER_CONFIGS[t as UserTier];
      tierCounts[t].revenue += config?.price || 0;
    });

    const tierColors: Record<string, string> = {
      EXPRESS_SINGLE: '#3B82F6',
      EXPRESS_PACK: '#6366F1',
      PRO: '#8B5CF6',
      MAX: '#10B981',
      CORP: '#EC4899',
    };

    const tierBreakdown = Object.entries(tierCounts).map(([tierKey, item]) => {
      const config = TIER_CONFIGS[tierKey as UserTier];
      const name = config?.name || tierKey;
      const sharePercent = users.length > 0 ? Math.round((item.count / users.length) * 100) : 0;
      return {
        tierKey,
        name,
        usersCount: item.count,
        revenue: item.revenue,
        sharePercent,
        color: tierColors[tierKey] || '#64748B',
      };
    });

    // 4. Источники проверок (Яндекс.Директ OAuth vs Ручные выгрузки)
    const directApiCount = connections.length;
    const manualCount = Math.max(0, totalAuditsCount - directApiCount);
    const totalSources = directApiCount + manualCount || 1;

    const auditSources = [
      {
        source: 'yandex_direct_api',
        label: 'Яндекс.Директ API (OAuth)',
        count: directApiCount,
        sharePercent: Math.round((directApiCount / totalSources) * 100),
        color: '#3B82F6',
      },
      {
        source: 'excel_csv_upload',
        label: 'Excel / CSV / Таблицы',
        count: manualCount,
        sharePercent: Math.round((manualCount / totalSources) * 100),
        color: '#10B981',
      },
    ];

    // 5. Посуточная динамика за выбранный период
    const dailyTimeline = (funnelStats.dailyDynamics || []).map((d) => ({
      date: d.date,
      dayLabel: d.label,
      revenue: d.payments * 2990, // средний чек
      demoAudits: d.audits,
      signUps: d.signups,
      purchases: d.payments,
      totalAudits: d.audits + d.payments,
    }));

    // 6. Хроника ключевых событий (Live Activity Trail)
    const recentActivity = [
      ...users.slice(-5).map((u) => ({
        id: `reg_${u.id}`,
        type: 'REGISTRATION' as const,
        title: `Новая регистрация: ${u.name || u.email.split('@')[0]}`,
        description: `Зарегистрирован пользователь с тарифом ${u.tier}`,
        timestamp: u.createdAt || new Date().toISOString(),
        userEmail: u.email,
      })),
      ...users
        .filter((u) => u.hasPaid)
        .slice(-5)
        .map((u) => {
          const config = TIER_CONFIGS[u.tier as UserTier];
          return {
            id: `pay_${u.id}`,
            type: 'PAYMENT' as const,
            title: `Оплата тарифа ${config?.name || u.tier}`,
            description: `Успешная транзакция через ЮKassa (${config?.priceFormatted || config?.price || 0} ₽)`,
            timestamp: u.createdAt || new Date().toISOString(),
            amountRub: config?.price || 0,
            userEmail: u.email,
          };
        }),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    const overallFunnelCr = funnelStats.conversionRateOverall || 0;
    const demoToRegCr = funnelStats.steps[0]?.dropOffPercent !== undefined
      ? Math.max(0, 100 - funnelStats.steps[0].dropOffPercent)
      : 0;
    const regToPaidCr = funnelStats.steps[1]?.dropOffPercent !== undefined
      ? Math.max(0, 100 - funnelStats.steps[1].dropOffPercent)
      : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        period,
        generatedAt: new Date().toISOString(),
        kpis: {
          totalRevenueRub,
          periodRevenueRub,
          totalUsersCount: users.length,
          periodNewUsersCount: periodUsers.length,
          paidUsersCount: paidUsers.length,
          totalAuditsCount,
          periodAuditsCount,
          totalLossDetectedRub,
          totalSpendAnalyzedRub,
          averageAuditScore,
          overallFunnelCr,
          demoToRegCr,
          regToPaidCr,
        },
        dailyTimeline,
        tierBreakdown,
        auditSources,
        recentActivity,
        storage: {
          r2Configured: !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID),
          provider: process.env.R2_ACCOUNT_ID ? 'r2' : 'local',
          bucketName: process.env.R2_BUCKET_NAME || 'cransys-reports',
        },
        notifications: {
          telegramConfigured: !!(process.env.TELEGRAM_ADMIN_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID),
          smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
          adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
          adminEmail: process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER,
        },
      },
    });
  } catch (error) {
    console.error('Error compiling admin analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate admin analytics' },
      { status: 500 }
    );
  }
}
