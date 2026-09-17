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

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'current_user';
  const popup = searchParams.get('popup') === '1' || searchParams.get('popup') === 'true' ? '1' : '0';

  // State параметр для защиты от CSRF атак и сохранения контекста пользователя
  const statePayload = {
    userId,
    popup,
    nonce: Math.random().toString(36).substring(2, 10),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const authUrl = new URL('https://oauth.yandex.ru/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('force_confirm', 'yes');

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('yandex_auth_user', userId, {
    path: '/',
    maxAge: 3600,
    sameSite: 'lax',
  });
  if (popup === '1') {
    response.cookies.set('yandex_auth_popup', '1', {
      path: '/',
      maxAge: 3600,
      sameSite: 'lax',
    });
  }

  return response;
}
