import { NextRequest, NextResponse } from 'next/server';
import { UserTier, TIER_CONFIGS } from '@/lib/billing/tiers';
import { findUserByEmail, findUserById, updateUser } from '@/lib/db/users-store';
import { recordTelemetryEvent } from '@/lib/db/telemetry-store';
import { notifyNewPayment } from '@/lib/notifications/admin-notify';

export async function POST(req: NextRequest) {
  try {
    const event = await req.json().catch(() => null);
    if (!event || !event.event || !event.object) {
      return NextResponse.json({ success: false, error: 'Invalid webhook payload' }, { status: 400 });
    }

    // Обработка события успешной оплаты payment.succeeded
    if (event.event === 'payment.succeeded') {
      const payment = event.object;
      const amount = parseFloat(payment.amount?.value || '0');
      const paymentId = payment.id;
      const metadata = payment.metadata || {};
      const userId = metadata.userId;
      const userEmail = metadata.userEmail;
      const requestedTier = metadata.tier as UserTier;

      const tierConfig = (requestedTier && TIER_CONFIGS[requestedTier]) ? TIER_CONFIGS[requestedTier] : TIER_CONFIGS.PRO;

      // Обновляем пользователя
      if (userId || userEmail) {
        const targetUser = userId ? await findUserById(userId) : (userEmail ? await findUserByEmail(userEmail) : null);
        if (targetUser) {
          await updateUser(targetUser.id, {
            tier: tierConfig.id,
            hasPaid: true,
            reportsLimit: (targetUser.reportsLimit || 0) + tierConfig.reportsLimit,
            revenue: (targetUser.revenue || 0) + amount,
            lastActive: new Date().toISOString().split('T')[0],
          });
        }
      }

      // Запись события в телеметрию
      try {
        await recordTelemetryEvent({
          visitorId: `vis_${(userId || 'guest').substring(0, 12)}`,
          userId: userId || null,
          eventName: 'payment_completed',
          pagePath: '/billing/webhook',
          metadata: {
            tier: tierConfig.id,
            amount,
            paymentId,
            via: 'yookassa_webhook',
          },
        });
      } catch {}

      // Оповещение администратора
      try {
        await notifyNewPayment({
          paymentId,
          amountRub: amount,
          tierName: tierConfig.name,
          userEmail: userEmail || undefined,
        });
      } catch (e) {
        console.warn('Webhook admin notification error:', e);
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Error handling YooKassa webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal webhook error' }, { status: 500 });
  }
}
