import { NextRequest, NextResponse } from 'next/server';
import { getStorageDiagnostics } from '@/lib/storage/report-storage';

export async function GET(req: NextRequest) {
  try {
    const diag = await getStorageDiagnostics();
    return NextResponse.json({
      success: true,
      storage: diag,
    });
  } catch (error) {
    console.error('Storage diagnostics error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка диагностики хранилища отчетов' },
      { status: 500 }
    );
  }
}
