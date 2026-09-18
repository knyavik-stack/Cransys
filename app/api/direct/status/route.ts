import { NextRequest, NextResponse } from 'next/server';
import {
  getDirectConnectionByUserId,
  getAllDirectConnectionsForUser,
  disconnectDirect,
  getDirectSlotsUsageForMonth,
} from '@/lib/db/direct-connections-store';
import { findUserById } from '@/lib/db/users-store';
import { getTierConfig } from '@/lib/billing/tiers';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'current_user';
  const targetId = req.nextUrl.searchParams.get('connectionId') || undefined;

  const [connections, conn, slotsUsage, user] = await Promise.all([
    getAllDirectConnectionsForUser(userId),
    getDirectConnectionByUserId(userId, targetId),
    getDirectSlotsUsageForMonth(userId),
    findUserById(userId),
  ]);

  const tier = user?.tier || 'PRO';
  const tierConfig = getTierConfig(tier);
  const maxSlots = tierConfig.maxConnectedAccounts || 1;

  if (!conn && connections.length === 0) {
    return NextResponse.json({
      connected: false,
      connections: [],
      slots: {
        maxSlots,
        usedSlots: slotsUsage.count,
        usedLogins: slotsUsage.usedLogins,
        availableSlots: Math.max(0, maxSlots - slotsUsage.count),
      },
    });
  }

  const activeConn = conn || connections[0];

  return NextResponse.json({
    connected: true,
    login: activeConn.login,
    connectionId: activeConn.id,
    connectedAt: activeConn.connectedAt,
    lastSyncAt: activeConn.lastSyncAt,
    status: activeConn.status,
    connections: connections.map((c) => ({
      id: c.id,
      login: c.login,
      connectedAt: c.connectedAt,
      lastSyncAt: c.lastSyncAt,
      status: c.status,
    })),
    slots: {
      maxSlots,
      usedSlots: slotsUsage.count,
      usedLogins: slotsUsage.usedLogins,
      availableSlots: Math.max(0, maxSlots - slotsUsage.count),
    },
  });
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'current_user';
  let connectionId =
    req.nextUrl.searchParams.get('connectionId') ||
    req.nextUrl.searchParams.get('login') ||
    undefined;

  try {
    const body = await req.json();
    if (body?.connectionId) connectionId = body.connectionId;
  } catch {
    // Body is optional for DELETE
  }

  await disconnectDirect(userId, connectionId);
  const remaining = await getAllDirectConnectionsForUser(userId);

  return NextResponse.json({
    success: true,
    message: connectionId ? 'Кабинет успешно отключен' : 'Все подключения к Яндекс.Директ отключены',
    remainingCount: remaining.length,
    remainingConnections: remaining.map((c) => ({ id: c.id, login: c.login })),
  });
}

