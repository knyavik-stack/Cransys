import { NextRequest, NextResponse } from 'next/server';
import { calculateFunnelStats, clearTelemetryEvents } from '@/lib/db/telemetry-store';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const periodParam = searchParams.get('period') || '7d';
    const period = ['today', '7d', '30d', '90d', 'all'].includes(periodParam)
      ? (periodParam as 'today' | '7d' | '30d' | '90d' | 'all')
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

export async function DELETE() {
  try {
    await clearTelemetryEvents();
    const stats = await calculateFunnelStats('7d');
    return NextResponse.json({
      success: true,
      message: 'Журнал телеметрии и воронка успешно очищены',
      stats,
    });
  } catch (error) {
    console.error('Error clearing telemetry stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear telemetry stats' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'clear') {
      await clearTelemetryEvents();
      const stats = await calculateFunnelStats('7d');
      return NextResponse.json({
        success: true,
        message: 'Журнал телеметрии и воронка успешно очищены',
        stats,
      });
    }
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error in funnel POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

