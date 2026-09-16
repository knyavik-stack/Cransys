import { NextRequest, NextResponse } from 'next/server';
import { AuditReportData } from '@/lib/audit/types';
import { mockMeblironData } from '@/tests/fixtures/mebliron';
import { defaultAuditEngine } from '@/lib/audit/engine';
import { getAuditById } from '@/lib/db/audit-store';

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

  try {
    const auditRecord = await getAuditById(id);

    if (!auditRecord) {
      return NextResponse.json(
        { success: false, message: 'Отчет не найден' },
        { status: 404 }
      );
    }

    let reportData: Partial<AuditReportData> = {};

    if (auditRecord.rulesSummary) {
      try {
        const parsed =
          typeof auditRecord.rulesSummary === 'string'
            ? JSON.parse(auditRecord.rulesSummary)
            : auditRecord.rulesSummary;

        if (parsed.overallScore !== undefined && parsed.rules) {
          reportData = parsed;
        } else if (Array.isArray(parsed)) {
          reportData = {
            rules: parsed,
            overallScore: Number(auditRecord.overallScore) || 50,
            totalSpendRub: Number(auditRecord.totalSpendRub) || 0,
            totalLossRub: Number(auditRecord.totalLossRub) || 0,
            healthyBudgetRub: Math.max(
              0,
              (Number(auditRecord.totalSpendRub) || 0) - (Number(auditRecord.totalLossRub) || 0)
            ),
          };
        }
      } catch {
        reportData = {
          overallScore: Number(auditRecord.overallScore) || 50,
          totalSpendRub: Number(auditRecord.totalSpendRub) || 0,
          totalLossRub: Number(auditRecord.totalLossRub) || 0,
          healthyBudgetRub: Math.max(
            0,
            (Number(auditRecord.totalSpendRub) || 0) - (Number(auditRecord.totalLossRub) || 0)
          ),
          rules: [],
        };
      }
    }

    return NextResponse.json({
      success: true,
      fileName: auditRecord.fileName,
      report: reportData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ошибка чтения отчета';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
