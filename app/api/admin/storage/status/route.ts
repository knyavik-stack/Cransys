import { NextResponse } from 'next/server';
import { getStorageStatus } from '@/lib/storage/report-storage';

export async function GET() {
  try {
    const status = await getStorageStatus();
    return NextResponse.json({
      success: true,
      storage: status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to check storage status' },
      { status: 500 }
    );
  }
}
