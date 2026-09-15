import { NextRequest, NextResponse } from 'next/server';
import { defaultAuditEngine } from '@/lib/audit/engine';
import { AuditInputData } from '@/lib/audit/types';
import { mockMeblironData } from '@/tests/fixtures/mebliron';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const data: AuditInputData = body && body.campaigns ? body : mockMeblironData;

    const report = await defaultAuditEngine.runAudit(data);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера при аудите';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
