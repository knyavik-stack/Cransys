import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.YANDEX_CLIENT_ID;
  const redirectUri = process.env.YANDEX_REDIRECT_URI || `${req.nextUrl.origin}/api/direct/callback`;

  if (!clientId) {
    return NextResponse.json(
      {
        success: false,
        error: 'YANDEX_CLIENT_ID не настроен. Пожалуйста, укажите ClientID приложения Яндекс OAuth.',
      },
      { status: 500 }
    );
  }

  // State параметр для защиты от CSRF атак
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl = new URL('https://oauth.yandex.ru/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('force_confirm', 'yes');

  return NextResponse.redirect(authUrl.toString());
}
