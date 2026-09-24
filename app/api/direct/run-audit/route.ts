import { NextRequest, NextResponse } from 'next/server';
import { getDirectConnectionByUserId } from '@/lib/db/direct-connections-store';
import { defaultAuditEngine } from '@/lib/audit/engine';
import { saveAuditRecord } from '@/lib/db/audit-store';
import { findUserById, updateUser } from '@/lib/db/users-store';
import { saveReportToStorage } from '@/lib/storage/report-storage';
import { notifyAuditCompleted } from '@/lib/notifications/admin-notify';
import { discoverCampaignsFromReports, fetchCampaignDeviceStats, fetchCampaignSearchQueries } from '@/lib/direct/reports-discovery';
import { generateAiDirectAudit } from '@/lib/ai/direct-analyst';
import { analyzeSearchQueriesAi } from '@/lib/ai/search-query-analyst';
import { isFeatureAllowed } from '@/lib/billing/tiers';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const userEmail = req.headers.get('x-user-email') || undefined;

    if (!userId || userId === 'guest' || userId === 'guest_account' || userId === 'current_user') {
      return NextResponse.json(
        {
          success: false,
          error: 'Требуется авторизация для запуска онлайн-аудита',
        },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const requestedCampaignIds: string[] = Array.isArray(body?.campaignIds) ? body.campaignIds : [];
    const targetAccountLogin: string = body?.accountLogin || '';
    const connectionId: string | undefined = body?.connectionId;
    const periodDays: number = typeof body?.periodDays === 'number' && body.periodDays > 0 ? body.periodDays : 90;
    const dateFrom: string | undefined = typeof body?.dateFrom === 'string' && body.dateFrom.length > 5 ? body.dateFrom : undefined;
    const dateTo: string | undefined = typeof body?.dateTo === 'string' && body.dateTo.length > 5 ? body.dateTo : undefined;

    // --- ПРОВЕРКА КВОТЫ АУДИТОВ ТАРИФА ---
    const user = await findUserById(userId);
    const isSuperAdmin = user?.role === 'ADMIN' || user?.role === 'TESTER_ADMIN';
    if (user && !isSuperAdmin) {
      if (user.reportsUsed >= user.reportsLimit) {
        return NextResponse.json(
          {
            success: false,
            error: `Лимит проверок исчерпан (${user.reportsUsed} из ${user.reportsLimit} шт.). Для проведения новых аудитов повысьте тариф или обратитесь в поддержку.`,
            limitExceeded: true,
            reportsUsed: user.reportsUsed,
            reportsLimit: user.reportsLimit,
          },
          { status: 403 }
        );
      }
    }

    const connection = await getDirectConnectionByUserId(userId, connectionId || targetAccountLogin);

    if (!connection || !connection.accessToken || connection.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Яндекс.Директ не подключен. Пожалуйста, выполните авторизацию через Яндекс ID.',
        },
        { status: 401 }
      );
    }

    const effectiveLogin = targetAccountLogin || connection.login || 'Кабинет Директа';

    // Запрашиваем реальные кампании через Direct API v5 (включая остановленные) со строго валидными полями
    let campaignsList: any[] = [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${connection.accessToken}`,
      'Accept-Language': 'ru',
    };
    if (targetAccountLogin && targetAccountLogin !== connection.login) {
      headers['Client-Login'] = targetAccountLogin;
    }

    const directRes = await fetch('https://api.direct.yandex.com/json/v5/campaigns', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        method: 'get',
        params: {
          SelectionCriteria: {
            States: ['ON', 'OFF', 'SUSPENDED', 'ENDED', 'ARCHIVED', 'CONVERTED'],
          },
          FieldNames: [
            'Id',
            'Name',
            'Status',
            'State',
            'Type',
            'StartDate',
            'Currency',
            'DailyBudget',
            'StatusClarification',
          ],
        },
      }),
    });

    if (directRes.ok) {
      const directJson = await directRes.json();
      if (directJson.error) {
        return NextResponse.json(
          {
            success: false,
            error: `Ошибка API Яндекс.Директ: ${directJson.error.error_detail || directJson.error.error_string} (код ${directJson.error.error_code})`,
          },
          { status: 400 }
        );
      }
      if (Array.isArray(directJson?.result?.Campaigns)) {
        campaignsList = directJson.result.Campaigns;
      }
    } else {
      const errText = await directRes.text();
      console.warn('[YANDEX DIRECT API] HTTP error:', directRes.status, errText);
      return NextResponse.json(
        {
          success: false,
          error: `Сервер Яндекс.Директ ответил ошибкой ${directRes.status}`,
        },
        { status: 502 }
      );
    }

    if (campaignsList.length === 0) {
      // Пытаемся обнаружить кампании через Reports API (для неоплаченных, остановленных из-за нулевого баланса или архивных)
      try {
        const targetSubLogin = targetAccountLogin && targetAccountLogin !== connection.login
          ? targetAccountLogin
          : connection.login || targetAccountLogin;
        const discovered = await discoverCampaignsFromReports(connection.accessToken, targetSubLogin);
        if (discovered.length > 0) {
          campaignsList = discovered.map((d) => ({
            Id: d.id,
            Name: d.name,
            Type: d.type,
            State: d.state,
            Status: d.status,
            StatusClarification: d.statusClarification,
            Cost: d.cost,
            Clicks: d.clicks,
            Impressions: d.impressions,
            Currency: 'RUB',
          }));
        }
      } catch (discErr) {
        console.warn('[YANDEX DIRECT AUDIT] Reports discovery error:', discErr);
      }
    }

    if (campaignsList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `В кабинете «${effectiveLogin}» не найдено кампаний для проведения аудита. Создайте или активируйте кампании в Яндекс.Директ.`,
        },
        { status: 400 }
      );
    }

    const effectivePeriodFrom =
      dateFrom || new Date(Date.now() - periodDays * 24 * 3600 * 1000).toISOString().split('T')[0];
    const effectivePeriodTo = dateTo || new Date().toISOString().split('T')[0];

    // Фильтруем выбранные пользователем кампании
    let filtered = campaignsList;
    if (requestedCampaignIds.length > 0) {
      filtered = campaignsList.filter((c: any) => requestedCampaignIds.includes(String(c.Id)));
      if (filtered.length === 0) filtered = campaignsList;
    }

    const campaignIdStrings = filtered.map((c: any) => String(c.Id));

    // Запрашиваем реальные данные по устройствам и конверсиям через Reports API
    let deviceStatsMap = new Map<string, any>();
    try {
      deviceStatsMap = await fetchCampaignDeviceStats(
        connection.accessToken,
        targetAccountLogin && targetAccountLogin !== connection.login ? targetAccountLogin : undefined,
        effectivePeriodFrom,
        effectivePeriodTo,
        campaignIdStrings
      );
    } catch (devErr) {
      console.warn('[DIRECT AUDIT] Device stats fetch error:', devErr);
    }

    // Запрашиваем реальные поисковые запросы из аккаунта (если тариф поддерживает или суперюзер)
    const userTier = user?.tier || 'PRO';
    const canUseSearchClustering = isSuperAdmin || isFeatureAllowed(userTier, 'searchClustering');
    let realSearchQueries: any[] = [];

    if (canUseSearchClustering) {
      try {
        realSearchQueries = await fetchCampaignSearchQueries(
          connection.accessToken,
          targetAccountLogin && targetAccountLogin !== connection.login ? targetAccountLogin : undefined,
          effectivePeriodFrom,
          effectivePeriodTo,
          campaignIdStrings
        );
      } catch (sqErr) {
        console.warn('[DIRECT AUDIT] Search queries fetch error:', sqErr);
      }
    }

    // Собираем реальные данные для расчетного движка аудита
    const auditData = {
      totalSpendRub: 0,
      totalConversions: 0,
      currency: filtered[0]?.Currency || 'RUB',
      searchQueries: realSearchQueries.length > 0 ? realSearchQueries : undefined,
      period: {
        from: effectivePeriodFrom,
        to: effectivePeriodTo,
      },
      campaigns: filtered.map((c: any) => {
        const campIdStr = String(c.Id);
        const deviceData = deviceStatsMap.get(campIdStr);

        const isStopped =
          c.State === 'OFF' || c.State === 'SUSPENDED' || c.State === 'ENDED' || c.State === 'ARCHIVED';
        const dailyBudgetValue = c.DailyBudget?.Amount ? Number(c.DailyBudget.Amount) / 1000000 : 1000;

        let campType: 'SMART' | 'SEARCH' | 'RSYA' | 'UNKNOWN' = 'UNKNOWN';
        if (c.Type === 'SMART_CAMPAIGN') {
          campType = 'SMART';
        } else if (c.Name?.toLowerCase().includes('поиск') || c.Name?.toLowerCase().includes('search')) {
          campType = 'SEARCH';
        } else if (c.Name?.toLowerCase().includes('рся') || c.Name?.toLowerCase().includes('сеть')) {
          campType = 'RSYA';
        }

        // Берем реальные цифры из Reports API, если доступны, либо из базового объекта кампании
        let realCost = deviceData ? deviceData.totalSpend : Number(c.Cost) || 0;
        let realClicks = deviceData ? deviceData.totalClicks : Number(c.Clicks) || 0;
        let realImpressions = deviceData ? deviceData.totalImpressions : Number(c.Impressions) || 0;
        let realConversions = deviceData ? deviceData.totalConversions : 0;

        const estSpend = isStopped
          ? realCost
          : realCost > 0
          ? realCost
          : Math.round(dailyBudgetValue * Math.min(periodDays, 30));

        const finalSpend = realCost > 0 ? Math.round(realCost) : estSpend;
        const finalClicks = realClicks > 0 ? realClicks : (isStopped ? 0 : Math.round(finalSpend / 35));
        const finalImpressions = realImpressions > 0 ? realImpressions : (isStopped ? 0 : finalClicks * 45);

        // Реальный срез по устройствам
        let desktopSpendRub = 0;
        let desktopConversions = 0;
        let mobileSpendRub = 0;
        let mobileConversions = 0;

        if (deviceData && (deviceData.desktopSpend > 0 || deviceData.mobileSpend > 0)) {
          desktopSpendRub = Math.round(deviceData.desktopSpend);
          desktopConversions = deviceData.desktopConversions;
          mobileSpendRub = Math.round(deviceData.mobileSpend);
          mobileConversions = deviceData.mobileConversions;
        } else {
          // Эвристический сплит при отсутствии данных в срезе
          desktopSpendRub = Math.round(finalSpend * 0.4);
          desktopConversions = 0;
          mobileSpendRub = Math.round(finalSpend * 0.6);
          mobileConversions = realConversions;
        }

        return {
          id: campIdStr,
          name: c.Name || `Кампания ${c.Id}`,
          type: campType,
          strategy: c.DailyBudget ? 'Оптимизация бюджета' : 'Автостратегия Яндекс.Директ',
          spendRub: finalSpend,
          clicks: finalClicks,
          impressions: finalImpressions,
          conversions: realConversions,
          desktopSpendRub,
          desktopConversions,
          mobileSpendRub,
          mobileConversions,
        };
      }),
    };

    auditData.totalSpendRub = auditData.campaigns.reduce((s, c) => s + c.spendRub, 0);
    auditData.totalConversions = auditData.campaigns.reduce((s, c) => s + c.conversions, 0);

    // Запуск расчета через наш независимый аудит-движок
    const report = await defaultAuditEngine.runAudit(auditData);
    report.campaigns = auditData.campaigns;

    // AI-анализ аномалий через Gemini (для тарифов PRO, MAX, CORP)
    const canUseAi = isSuperAdmin || isFeatureAllowed(userTier, 'aiInsights');
    if (canUseAi) {
      try {
        const aiResult = await generateAiDirectAudit(auditData, report);
        if (aiResult) {
          report.aiAnalysis = aiResult;
        }
      } catch (aiErr) {
        console.warn('[DIRECT AUDIT] AI analysis skipped:', aiErr);
      }
    }

    // AI-анализ семантики поисковых запросов
    if (canUseSearchClustering && realSearchQueries.length > 0) {
      try {
        const queryAiResult = await analyzeSearchQueriesAi(realSearchQueries);
        if (queryAiResult) {
          report.searchQueryAnalysis = queryAiResult;
        }
      } catch (qErr) {
        console.warn('[DIRECT AUDIT] Query analysis skipped:', qErr);
      }
    }

    const selectedCount = auditData.campaigns.length;
    const fileName = `Яндекс.Директ (${effectiveLogin}) — ${selectedCount} ${selectedCount === 1 ? 'кампания' : 'кампаний'} (${periodDays} дн.)`;

    // Персистентно сохраняем в базу данных
    const auditId = await saveAuditRecord({
      userId,
      userEmail,
      fileName,
      report,
      tier: userTier,
    });

    // Сохраняем в Cloudflare R2 / локальное хранилище
    const reportIdentifier = auditId || `audit_${Date.now()}`;
    try {
      await saveReportToStorage(reportIdentifier, report, {
        userId,
        userEmail,
        fileName,
        score: report.overallScore,
        totalLossRub: report.totalLossRub,
        totalSpendRub: report.totalSpendRub,
        tier: userTier,
      });
    } catch (storageErr) {
      console.warn('Direct audit storage save skipped:', storageErr);
    }

    // Оповещение администратора/собственника
    try {
      await notifyAuditCompleted({
        reportId: reportIdentifier,
        userEmail,
        sourceType: `Яндекс.Директ API (${effectiveLogin})`,
        campaignCount: selectedCount,
        score: report.overallScore,
        totalSpendRub: report.totalSpendRub,
        totalLossRub: report.totalLossRub,
        isDemo: false,
      });
    } catch (notifyErr) {
      console.warn('Direct audit notification skipped:', notifyErr);
    }

    // Списываем 1 аудит из баланса проверок пользователя
    let updatedReportsUsed = user?.reportsUsed ?? 0;
    if (user && !isSuperAdmin) {
      updatedReportsUsed = (user.reportsUsed || 0) + 1;
      try {
        await updateUser(user.id, {
          reportsUsed: updatedReportsUsed,
          lastActive: new Date().toISOString().split('T')[0],
        });
      } catch (err) {
        console.warn('Error debiting user report quota:', err);
      }
    }

    return NextResponse.json({
      success: true,
      report,
      auditId,
      fileName,
      campaignsAnalyzed: selectedCount,
      accountLogin: effectiveLogin,
      periodDays,
      source: 'LIVE_API',
      reportsUsed: updatedReportsUsed,
      reportsLimit: user?.reportsLimit ?? 10,
    });
  } catch (error: any) {
    console.error('[YANDEX DIRECT] Audit generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка при проведении прямого аудита через API',
        details: error?.message || 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}
