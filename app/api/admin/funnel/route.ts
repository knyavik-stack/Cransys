import { NextRequest, NextResponse } from 'next/server';
import { calculateFunnelStats } from '@/lib/db/telemetry-store';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const periodParam = searchParams.get('period') || '7d';
    const period = ['today', '7d', '30d', 'all'].includes(periodParam)
      ? (periodParam as 'today' | '7d' | '30d' | 'all')
      : '7d';

    const stats = await calculateFunnelStats(period);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error calculating funnel stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate funnel stats' },
      { status: 500 }
    );
  }
}
