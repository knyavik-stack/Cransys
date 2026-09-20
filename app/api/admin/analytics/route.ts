import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersAsync } from '@/lib/db/users-store';
import { getTelemetryEvents, calculateFunnelStats } from '@/lib/db/telemetry-store';
import { getAllDirectConnections } from '@/lib/db/direct-connections-store';
import { TIER_CONFIGS, UserTier } from '@/lib/billing/tiers';
import { getDb, ensureDatabaseReady } from '@/db';

export interface AdminAnalyticsSummary {
  period: 'today' | '7d' | '30d' | '90d' | 'all';
  timestamp: string;
  // KPI для собственника (Executive KPI)
  revenue: {
    total: number;
    periodRevenue: number;
    arpu: number;
    payingUsersCount: number;
    payingConversionRate: number;
    estimatedSavedAdWaste: number;
  };
  // KPI для администратора (Ops KPI)
  users: {
    total: number;
    verifiedEmailCount: number;
    verifiedEmailPercent: number;
    blockedCount: number;
    activeInPeriodCount: number;
  };
  // Аудиты и подключения
  audits: {
    totalConducted: number;
    periodConducted: number;
    directAccountsConnected: number;
    averageScore: number;
  };
  // Распределение по тарифам
  tierDistribution: Array<{
    tierKey: UserTier;
    name: string;
    count: number;
    revenue: number;
    color: string;
    percent: number;
  }>;
  // Динамика по дням для графиков
  timeline: Array<{
    date: string;
    label: string;
    revenue: number;
    audits: number;
    registrations: number;
    visitors: number;
  }>;
  // Последние реальные события и клиенты
  recentActivity: Array<{
    id: string;
    type: 'payment' | 'registration' | 'audit' | 'direct_connect';
    title: string;
    description: string;
    userEmail: string;
    userName: string;
    amount?: number;
    timestamp: string;
  }>;
}

const TIER_COLORS: Record<UserTier, string> = {
  EXPRESS_SINGLE: '#94A3B8',
  EXPRESS_PACK: '#64748B',
  PRO: '#2563EB',
  MAX: '#9333EA',
  CORP: '#4F46E5',
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const periodParam = searchParams.get('period') || '7d';
    const period = ['today', '7d', '30d', '90d', 'all'].includes(periodParam)
      ? (periodParam as 'today' | '7d' | '30d' | '90d' | 'all')
      : '7d';

    const now = Date.now();
    let minTimestamp = 0;
    if (period === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      minTimestamp = startOfDay.getTime();
    } else if (period === '7d') {
      minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    } else if (period === '30d') {
      minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    } else if (period === '90d') {
      minTimestamp = now - 90 * 24 * 60 * 60 * 1000;
    }

    // 1. Получаем реальных пользователей
    const allUsers = await getAllUsersAsync();
    const totalUsers = allUsers.length;
    const verifiedUsers = allUsers.filter((u) => u.emailVerified).length;
    const verifiedPercent = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;
    const blockedCount = allUsers.filter((u) => u.isBlocked).length;

    // Пользователи, активные в выбранный период
    const activeInPeriod = allUsers.filter((u) => {
      if (!u.lastActive) return false;
      const t = new Date(u.lastActive).getTime();
      return isNaN(t) || t >= minTimestamp;
    }).length;

    // 2. Расчет выручки и плательщиков
    const payingUsers = allUsers.filter((u) => u.hasPaid || (u.revenue && u.revenue > 0));
    const payingCount = payingUsers.length;
    const totalRevenue = allUsers.reduce((sum, u) => sum + (Number(u.revenue) || 0), 0);
    const payingConversion = totalUsers > 0 ? Math.round((payingCount / totalUsers) * 100 * 10) / 10 : 0;
    const arpu = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;

    // Пользователи, созданные в выбранный период
    const usersInPeriod = allUsers.filter((u) => {
      const t = new Date(u.createdAt).getTime();
      return t >= minTimestamp;
    });
    const periodRevenue = usersInPeriod.reduce((sum, u) => sum + (Number(u.revenue) || 0), 0);

    // 3. Распределение по тарифам
    const tierCounts: Record<UserTier, { count: number; revenue: number }> = {
      EXPRESS_SINGLE: { count: 0, revenue: 0 },
      EXPRESS_PACK: { count: 0, revenue: 0 },
      PRO: { count: 0, revenue: 0 },
      MAX: { count: 0, revenue: 0 },
      CORP: { count: 0, revenue: 0 },
    };

    allUsers.forEach((u) => {
      const t = u.tier || 'EXPRESS_SINGLE';
      if (tierCounts[t]) {
        tierCounts[t].count++;
        tierCounts[t].revenue += Number(u.revenue) || 0;
      } else {
        tierCounts.EXPRESS_SINGLE.count++;
        tierCounts.EXPRESS_SINGLE.revenue += Number(u.revenue) || 0;
      }
    });

    const tierDistribution = (Object.keys(tierCounts) as UserTier[]).map((tKey) => {
      const conf = TIER_CONFIGS[tKey];
      const count = tierCounts[tKey].count;
      const rev = tierCounts[tKey].revenue;
      const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
      return {
        tierKey: tKey,
        name: conf?.name || tKey,
        count,
        revenue: rev,
        color: TIER_COLORS[tKey] || '#94A3B8',
        percent: pct,
      };
    });

    // 4. Подключения Яндекс.Директ
    let directConnectionsCount = 0;
    try {
      const connections = await getAllDirectConnections();
      directConnectionsCount = connections.filter((c) => c.status === 'ACTIVE').length;
    } catch {}

    // 5. Данные из базы PostgreSQL (аудиты, отчеты)
    let totalAuditsCount = 0;
    let periodAuditsCount = 0;
    let totalEstimatedWaste = 0;
    let averageHealthScore = 74;

    const sql = getDb();
    if (sql) {
      try {
        await ensureDatabaseReady();
        const auditRows = await sql`
          SELECT 
            COUNT(*)::int as total_jobs,
            COUNT(*) FILTER (WHERE created_at >= ${new Date(minTimestamp).toISOString()})::int as period_jobs
          FROM public.audit_jobs;
        `;
        if (auditRows && auditRows.length > 0) {
          totalAuditsCount = Number(auditRows[0].total_jobs) || 0;
          periodAuditsCount = Number(auditRows[0].period_jobs) || 0;
        }

        const reportRows = await sql`
          SELECT 
            COALESCE(SUM(total_loss_rub), 0)::numeric as total_loss,
            COALESCE(AVG(overall_score), 74)::int as avg_score
          FROM public.audit_reports;
        `;
        if (reportRows && reportRows.length > 0) {
          totalEstimatedWaste = Number(reportRows[0].total_loss) || 0;
          averageHealthScore = Number(reportRows[0].avg_score) || 74;
        }
      } catch (dbErr) {
        console.warn('DB error querying audit aggregates in analytics:', dbErr);
      }
    }

    // Дополняем аудитными данными из общего счетчика пользователей (reportsUsed)
    const sumReportsUsed = allUsers.reduce((sum, u) => sum + (Number(u.reportsUsed) || 0), 0);
    totalAuditsCount = Math.max(totalAuditsCount, sumReportsUsed);

    // 6. Телеметрия и динамика по дням
    const funnel = await calculateFunnelStats(period);
    const telemetryEvents = getTelemetryEvents();

    const daysCount = period === 'today' ? 1 : (period === '90d' ? 30 : (period === '30d' ? 14 : 7));
    const timeline: Array<{
      date: string;
      label: string;
      revenue: number;
      audits: number;
      registrations: number;
      visitors: number;
    }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const dObj = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = dObj.toISOString().split('T')[0];
      const labelStr = dObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

      // События этого дня
      const dayEvts = telemetryEvents.filter((e) => e.createdAt && e.createdAt.startsWith(dateStr));
      const dayVisits = new Set(dayEvts.filter((e) => e.eventName === 'page_view').map((e) => e.visitorId)).size;
      const dayAudits = dayEvts.filter((e) => e.eventName === 'audit_completed' || e.eventName === 'audit_init').length;

      // Пользователи, зарегистрированные в этот день
      const dayUsers = allUsers.filter((u) => u.createdAt && u.createdAt.startsWith(dateStr));
      const dayRegistrations = dayUsers.length;
      const dayRevenue = dayUsers.reduce((sum, u) => sum + (Number(u.revenue) || 0), 0);

      timeline.push({
        date: dateStr,
        label: labelStr,
        revenue: dayRevenue,
        audits: dayAudits,
        registrations: dayRegistrations,
        visitors: dayVisits,
      });
    }

    // 7. Формирование ленты последних реальных активностей
    const recentActivity: AdminAnalyticsSummary['recentActivity'] = [];

    // Пользователи с недавней регистрацией
    allUsers.slice(0, 8).forEach((u) => {
      recentActivity.push({
        id: `act_reg_${u.id}`,
        type: 'registration',
        title: `Регистрация: ${u.name}`,
        description: `Тариф ${TIER_CONFIGS[u.tier]?.name || u.tier} • Email: ${u.email}`,
        userEmail: u.email,
        userName: u.name,
        amount: u.revenue || 0,
        timestamp: u.createdAt,
      });
    });

    // Сортировка по времени
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const responseData: AdminAnalyticsSummary = {
      period,
      timestamp: new Date().toISOString(),
      revenue: {
        total: totalRevenue,
        periodRevenue,
        arpu,
        payingUsersCount: payingCount,
        payingConversionRate: payingConversion,
        estimatedSavedAdWaste: totalEstimatedWaste || (totalAuditsCount * 42500),
      },
      users: {
        total: totalUsers,
        verifiedEmailCount: verifiedUsers,
        verifiedEmailPercent: verifiedPercent,
        blockedCount,
        activeInPeriodCount: activeInPeriod,
      },
      audits: {
        totalConducted: totalAuditsCount,
        periodConducted: periodAuditsCount,
        directAccountsConnected: directConnectionsCount,
        averageScore: averageHealthScore,
      },
      tierDistribution,
      timeline,
      recentActivity: recentActivity.slice(0, 10),
    };

    return NextResponse.json({
      success: true,
      analytics: responseData,
    });
  } catch (error) {
    console.error('Error calculating admin analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при расчете аналитических показателей' },
      { status: 500 }
    );
  }
}
