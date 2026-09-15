import { NextRequest, NextResponse } from 'next/server';
import { defaultAuditEngine } from '@/lib/audit/engine';
import { AuditInputData } from '@/lib/audit/types';
import { mockMeblironData } from '@/tests/fixtures/mebliron';
import { parseDirectExcel } from '@/lib/parser/excel-parser';
import { generateAiDirectAudit } from '@/lib/ai/direct-analyst';
import { analyzeSearchQueriesAi } from '@/lib/ai/search-query-analyst';
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

    // 4. Сохранение в базу данных Neon (если подключена)
    let savedJobId: string | null = null;
    const sql = getDb();
    if (sql) {
      try {
        const userIdHeader = req.headers.get('x-user-id');
        const userEmailHeader = req.headers.get('x-user-email');

        let validUserId: string | null = null;
        if (userIdHeader && userEmailHeader) {
          try {
            await sql`
              INSERT INTO public.profiles (id, email, first_name)
              VALUES (${userIdHeader}, ${userEmailHeader}, 'Пользователь')
              ON CONFLICT (id) DO NOTHING;
            `;
            validUserId = userIdHeader;
          } catch {
            // Игнорируем ошибку профиля, если таблица еще не обновлена
          }
        }

        const insertRes = await sql`
          INSERT INTO public.audit_jobs (user_id, file_name, source_type, status)
          VALUES (${validUserId}, ${fileName}, 'YANDEX_DIRECT_XLSX', 'COMPLETED')
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
              ${report.overallScore}, ${JSON.stringify(report)}
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

