import { NextRequest, NextResponse } from 'next/server';
import { fetchSiteSettingsAsync, saveSiteSettingsAsync } from '@/lib/db/site-settings-store';

export async function GET() {
  try {
    const settings = await fetchSiteSettingsAsync();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения настроек сайта' },
      { status: 500 }
     );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Некорректные параметры настроек' },
        { status: 400 }
      );
    }

    const updated = await saveSiteSettingsAsync(settings);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сохранения настроек' },
      { status: 500 }
    );
  }
}

