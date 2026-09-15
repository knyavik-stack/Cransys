import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { AuditReportData } from '@/lib/audit/types';
import { mockMeblironData } from '@/tests/fixtures/mebliron';
import { defaultAuditEngine } from '@/lib/audit/engine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id === 'demo-1' || id === 'demo-mebliron') {
    const report = await defaultAuditEngine.runAudit(mockMeblironData);
    report.campaigns = mockMeblironData.campaigns;
    return NextResponse.json({
      success: true,
      report,
      fileName: 'mebliron_feb_jul_2026.xlsx',
    });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { success: false, message: 'База данных не подключена' },
      { status: 404 }
    );
  }

  try {
    const rows = await sql`
      SELECT 
        j.id as "jobId",
        j.file_name as "fileName",
        j.created_at as "createdAt",
        r.tier,
        r.total_spend_rub as "totalSpendRub",
        r.total_loss_rub as "totalLossRub",
        r.overall_score as "overallScore",
        r.rules_summary as "rulesSummary"
      FROM public.audit_jobs j
      LEFT JOIN public.audit_reports r ON r.audit_job_id = j.id
      WHERE j.id = ${id}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Отчет не найден' },
        { status: 404 }
      );
    }

    const row = rows[0];
    let reportData: Partial<AuditReportData> = {};

    if (row.rulesSummary) {
      try {
        const parsed = typeof row.rulesSummary === 'string' ? JSON.parse(row.rulesSummary) : row.rulesSummary;
        if (parsed.overallScore !== undefined && parsed.rules) {
          reportData = parsed;
        } else if (Array.isArray(parsed)) {
          reportData = {
            rules: parsed,
            overallScore: Number(row.overallScore) || 50,
            totalSpendRub: Number(row.totalSpendRub) || 0,
            totalLossRub: Number(row.totalLossRub) || 0,
            healthyBudgetRub: Math.max(0, (Number(row.totalSpendRub) || 0) - (Number(row.totalLossRub) || 0)),
          };
        }
      } catch {
        reportData = {
          overallScore: Number(row.overallScore) || 50,
          totalSpendRub: Number(row.totalSpendRub) || 0,
          totalLossRub: Number(row.totalLossRub) || 0,
          healthyBudgetRub: Math.max(0, (Number(row.totalSpendRub) || 0) - (Number(row.totalLossRub) || 0)),
          rules: [],
        };
      }
    }

    return NextResponse.json({
      success: true,
      fileName: row.fileName,
      report: reportData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ошибка чтения отчета';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
