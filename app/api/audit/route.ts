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

    // Добавляем флаг демо в сам отчет
    if (isDemoRequest) {
      report.isDemo = true;
    }

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
    }

    // 4. Сохранение в базу данных Neon и облачное хранилище отчетов
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
      } catch (dbErr) {
        console.warn('Audit record DB save skipped:', dbErr);
      }

      // Сохраняем полный JSON-отчет в Cloudflare R2 / Local storage
      const reportIdentifier = savedJobId || `audit_${Date.now()}`;
      try {
        await saveReportToStorage(reportIdentifier, report, {
          userId: userIdHeader,
          userEmail: userEmailHeader,
        });
      } catch (storageErr) {
        console.warn('Report storage save skipped:', storageErr);
      }

      // Оповещение администратора/собственника
      try {
        await notifyAuditCompleted({
          reportId: reportIdentifier,
          userEmail: userEmailHeader,
          campaignCount: inputData.campaigns?.length || 1,
          score: report.overallScore,
          wasteRub: report.totalLossRub,
          isDemo: false,
        });
      } catch (notifyErr) {
        console.warn('Admin notification skipped:', notifyErr);
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
