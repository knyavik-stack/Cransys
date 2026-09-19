import { NextRequest, NextResponse } from 'next/server';
import { recordTelemetryEvent } from '@/lib/db/telemetry-store';
import { TelemetryEventType } from '@/lib/telemetry/types';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      // Для Blob из navigator.sendBeacon
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const {
      visitorId,
      userId,
      eventName,
      pagePath,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      referrer,
      metadata,
      userAgent,
    } = body;

    if (!visitorId || !eventName) {
      return NextResponse.json(
        { success: false, error: 'visitorId and eventName are required' },
        { status: 400 }
      );
    }

    const saved = await recordTelemetryEvent({
      visitorId: String(visitorId),
      userId: userId ? String(userId) : null,
      eventName: eventName as TelemetryEventType,
      pagePath: pagePath ? String(pagePath) : '/',
      utmSource: utmSource ? String(utmSource) : null,
      utmMedium: utmMedium ? String(utmMedium) : null,
      utmCampaign: utmCampaign ? String(utmCampaign) : null,
      utmContent: utmContent ? String(utmContent) : null,
      utmTerm: utmTerm ? String(utmTerm) : null,
      referrer: referrer ? String(referrer) : null,
      metadata: typeof metadata === 'object' ? metadata : {},
      userAgent: userAgent ? String(userAgent) : req.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true, eventId: saved.id });
  } catch (error) {
    console.error('Error in telemetry event handler:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
