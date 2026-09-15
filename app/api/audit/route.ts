import { NextRequest, NextResponse } from 'next/server';
import { defaultAuditEngine } from '@/lib/audit/engine';
import { AuditInputData } from '@/lib/audit/types';
import { mockMeblironData } from '@/tests/fixtures/mebliron';
import { parseDirectExcel } from '@/lib/parser/excel-parser';
import { generateAiDirectAudit } from '@/lib/ai/direct-analyst';
import { getDb } from '@/db';

export async function POST(req: NextRequest) {
  try {
    let inputData: AuditInputData = mockMeblironData;
    let fileName = 'mebliron_feb_jul_2026.xlsx';

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
      if (body && body.campaigns) {
        inputData = body;
      }
    }

    // 1. Выполнение математического движка правил
    const report = await defaultAuditEngine.runAudit(inputData);

    // Добавляем сами кампании для интерактивных визуализаций
    report.campaigns = inputData.campaigns;

    // 2. Интеллектуальный AI-анализ через Gemini 3.8 Flash (если доступен GEMINI_API_KEY)
    try {
      const aiResult = await generateAiDirectAudit(inputData, report);
      if (aiResult) {
        report.aiAnalysis = aiResult;
      }
    } catch (aiErr) {
      console.warn('AI analysis skipped (graceful fallback):', aiErr);
    }

    // 3. Сохранение в базу данных Neon (если подключена)
    let savedJobId: string | null = null;
    const sql = getDb();
    if (sql) {
      try {
        const insertRes = await sql`
          INSERT INTO public.audit_jobs (file_name, source_type, status)
          VALUES (${fileName}, 'YANDEX_DIRECT_XLSX', 'COMPLETED')
          RETURNING id;
        `;
        if (insertRes && insertRes[0]) {
          savedJobId = insertRes[0].id;
          await sql`
            INSERT INTO public.audit_reports (
              audit_job_id, tier, total_spend_rub, total_loss_rub, overall_score, rules_summary
            )
            VALUES (
              ${savedJobId}, 'EXPRESS', ${report.totalSpendRub}, ${report.totalLossRub},
              ${report.overallScore}, ${JSON.stringify(report.rules)}
            );
          `;
        }
      } catch (dbErr) {
        console.warn('DB record skipped (graceful fallback):', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      report,
      jobId: savedJobId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось распознать отчет';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
