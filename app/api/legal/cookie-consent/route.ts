import { NextRequest, NextResponse } from 'next/server';
import { getCookieConsentDataAsync, recordCookieConsent } from '@/lib/db/cookie-consent-store';

export async function GET() {
  try {
    const data = await getCookieConsentDataAsync();
    return NextResponse.json({
      success: true,
      stats: data.stats,
      recentLogs: data.recentLogs,
    });
  } catch (error) {
    console.error('Error getting cookie consent data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { choice, preferences } = body;

    if (!choice || !preferences) {
      return NextResponse.json(
        { success: false, error: 'Invalid consent payload' },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    
    // Маскируем IP для соблюдения 152-ФЗ (убираем последний октет)
    let ipMasked: string | undefined = undefined;
    if (rawIp) {
      const parts = rawIp.split(',')[0].trim().split('.');
      if (parts.length === 4) {
        ipMasked = `${parts[0]}.${parts[1]}.${parts[2]}.***`;
      } else {
        ipMasked = 'masked_ip';
      }
    }

    const updated = await recordCookieConsent({
      choice,
      preferences,
      userAgent,
      ipMasked,
    });

    return NextResponse.json({
      success: true,
      stats: updated.stats,
    });
  } catch (error) {
    console.error('Error recording cookie consent:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

