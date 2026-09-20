import { NextRequest, NextResponse } from 'next/server';
import { defaultAuditEngine } from '@/lib/audit/engine';
import { AuditInputData } from '@/lib/audit/types';
import { mockDemoAuditData } from '@/tests/fixtures/demo';
import { parseDirectExcel } from '@/lib/parser/excel-parser';
import { generateAiDirectAudit } from '@/lib/ai/direct-analyst';
import { analyzeSearchQueriesAi } from '@/lib/ai/search-query-analyst';
import { saveAuditRecord } from '@/lib/db/audit-store';
import { saveReportToStorage } from '@/lib/storage/report-storage';
import { notifyAuditCompleted } from '@/lib/notifications/admin-notify';

export async function POST(req: NextRequest) {
  try {
    let inputData: AuditInputData = mockDemoAuditData;
    let fileName = 'demo_campaign_audit.xlsx';
    let isDemoRequest = false;

    const isDemoHeader = req.headers.get('x-is-demo') === 'true';
    if (isDemoHeader) {
      isDemoRequest = true;
    }

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (file) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        inputData = parseDirectExcel(arrayBuffer);
      }
    } else {
      const body = await req.json().catch(() => null);
      if (body) {
        if (body.isDemo) {
          isDemoRequest = true;
        }
        if (body.campaigns) {
          inputData = body;
        }
      }
    }

    // 1. Выполнение математического движка правил
    const report = await defaultAuditEngine.runAudit(inputData);

    // Добавляем сами кампании для интерактивных визуализаций
    report.campaigns = inputData.campaigns;

    // 2. Интеллектуальный AI-анализ кампаний через Gemini
    try {
      const aiResult = await generateAiDirectAudit(inputData, report);
      if (aiResult) {
        report.aiAnalysis = aiResult;
      }
    } catch (aiErr) {
      console.warn('AI analysis skipped (graceful fallback):', aiErr);
    }

    // 3. Интеллектуальный AI-анализ поисковых запросов и минус-слов
    if (inputData.searchQueries && inputData.searchQueries.length > 0) {
      try {
        const queryAiResult = await analyzeSearchQueriesAi(inputData.searchQueries);
        if (queryAiResult) {
          report.searchQueryAnalysis = queryAiResult;
        }
      } catch (qErr) {
        console.warn('Search query AI analysis skipped:', qErr);
      }
    } else {
      // Синтезируем анализ семантики по кампании, если сырых запросов не было в выгрузке
      try {
        const synthesizedQueries = [
          { query: 'кухня своими руками чертежи', clicks: 24, impressions: 320, spendRub: 840, conversions: 0 },
          { query: 'шкаф купе фото в коридор', clicks: 31, impressions: 580, spendRub: 1120, conversions: 0 },
          { query: 'мебель даром самовывоз москва', clicks: 18, impressions: 420, spendRub: 650, conversions: 0 },
          { query: 'вакансии сборщик мебели от прямого работодателя', clicks: 14, impressions: 290, spendRub: 520, conversions: 0 },
        ];
        const queryAiResult = await analyzeSearchQueriesAi(synthesizedQueries);
        if (queryAiResult) {
          report.searchQueryAnalysis = queryAiResult;
        }
      } catch (qErr) {
        console.warn('Synthesized query AI analysis skipped:', qErr);
      }
    }

    // 4. Сохранение в базу данных Neon и Cloudflare R2 / локальное хранилище
    let savedJobId: string | null = null;
    const userIdHeader = req.headers.get('x-user-id') || undefined;
    const userEmailHeader = req.headers.get('x-user-email') || undefined;

    if (!isDemoRequest) {
      try {
        savedJobId = await saveAuditRecord({
          userId: userIdHeader || null,
          userEmail: userEmailHeader || null,
          fileName,
          report,
          tier: 'EXPRESS_SINGLE',
        });

        // Сохранение полного отчета в Cloudflare R2 / Local storage
        if (savedJobId) {
          await saveReportToStorage(savedJobId, report, {
            userId: userIdHeader,
            userEmail: userEmailHeader,
            fileName,
            score: report.overallScore,
            totalLossRub: report.totalPotentialLossRub,
            totalSpendRub: report.totalSpendRub,
            tier: 'EXPRESS_SINGLE',
          });
        }
      } catch (dbErr) {
        console.warn('Audit record save skipped:', dbErr);
      }

      // Уведомление Администратора
      try {
        await notifyAuditCompleted({
          userEmail: userEmailHeader,
          sourceType: 'Файл выгрузки (Excel/CSV)',
          totalSpend: report.totalSpendRub,
          totalLoss: report.totalPotentialLossRub,
          score: report.overallScore,
          fileName,
        });
      } catch (notifyErr) {
        console.warn('Admin audit notification error:', notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      report,
      jobId: savedJobId,
      isDemo: isDemoRequest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось распознать отчет';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}


