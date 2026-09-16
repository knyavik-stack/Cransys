import { NextRequest, NextResponse } from 'next/server';
import { getDirectConnectionByUserId, disconnectDirect } from '@/lib/db/direct-connections-store';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'current_user';
  const conn = await getDirectConnectionByUserId(userId);

  if (!conn) {
    return NextResponse.json({
      connected: false,
    });
  }

  return NextResponse.json({
    connected: true,
    login: conn.login,
    connectedAt: conn.connectedAt,
    lastSyncAt: conn.lastSyncAt,
    status: conn.status,
  });
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'current_user';
  await disconnectDirect(userId);

  return NextResponse.json({
    success: true,
    message: 'Подключение к Яндекс.Директ отключено',
  });
}
