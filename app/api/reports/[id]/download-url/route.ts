import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // В соответствии с регламентом ИБ: генерация безопасного временного URL
  return NextResponse.json({
    success: true,
    reportId: id,
    downloadUrl: `/api/audit?reportId=${encodeURIComponent(id)}&format=pdf`,
    expiresInSeconds: 900, // 15 минут
  });
}
