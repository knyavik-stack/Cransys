import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, findUserById, updateUser } from '@/lib/db/users-store';
import { recordTelemetryEvent } from '@/lib/db/telemetry-store';
import { notifyNewPayment } from '@/lib/notifications/admin-notify';
import { TIER_CONFIGS, UserTier } from '@/lib/billing/tiers';
import { getDb, ensureDatabaseReady } from '@/db';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { type, event, object: paymentObj } = body;

    if (type !== 'notification' || !paymentObj || !paymentObj.id) {
      return NextResponse.json({ error: 'Unrecognized notification structure' }, { status: 400 });
    }

    const paymentId = paymentObj.id;
    const status = paymentObj.status;
    const amountVal = parseFloat(paymentObj.amount?.value || '0');
    const metadata = paymentObj.metadata || {};
    const userId = metadata.userId || metadata.user_id;
    const userEmail = metadata.userEmail || metadata.user_email || metadata.email;
    const rawTier = metadata.tier || 'PRO';

    const normalizedTier: UserTier =
      rawTier === 'EXPRESS'
        ? 'EXPRESS_PACK'
        : ['EXPRESS_SINGLE', 'EXPRESS_PACK', 'PRO', 'MAX', 'CORP'].includes(rawTier)
        ? (rawTier as UserTier)
        : 'PRO';

    const tierConfig = TIER_CONFIGS[normalizedTier] || TIER_CONFIGS.PRO;

    // Обработка успешного платежа
    if (event === 'payment.succeeded' || status === 'succeeded') {
      let targetUser = null;
      if (userId) {
        targetUser = await findUserById(userId);
      }
      if (!targetUser && userEmail) {
        targetUser = await findUserByEmail(userEmail);
      }

      if (targetUser) {
        const newTotalRevenue = (targetUser.revenue || 0) + (amountVal || tierConfig.price);
        const newReportsLimit = Math.max(targetUser.reportsLimit, tierConfig.reportsLimit);

        await updateUser(targetUser.id, {
          tier: normalizedTier,
          hasPaid: true,
          reportsLimit: newReportsLimit,
          revenue: newTotalRevenue,
          lastActive: new Date().toISOString().split('T')[0],
        });
      }

      // Запись в базу PostgreSQL (таблица payments)
      const sql = getDb();
      if (sql) {
        try {
          await ensureDatabaseReady();
          await sql`
            INSERT INTO public.payments (
              user_id, amount_rub, tariff_target, payment_status, yookassa_payment_id, created_at
            ) VALUES (
              ${targetUser?.id || userId || null},
              ${amountVal || tierConfig.price},
              ${normalizedTier},
              'SUCCEEDED',
              ${paymentId},
              NOW()
            )
            ON CONFLICT (yookassa_payment_id) DO UPDATE SET
              payment_status = 'SUCCEEDED';
          `;
        } catch (dbErr) {
          console.warn('DB payment record error:', dbErr);
        }
      }

      // Запись в телеметрию
      try {
        await recordTelemetryEvent({
          visitorId: `vis_${(targetUser?.id || userId || 'customer').substring(0, 12)}`,
          userId: targetUser?.id || userId || null,
          eventName: 'payment_completed',
          pagePath: '/api/billing/webhook',
          metadata: {
            paymentId,
            amount: amountVal || tierConfig.price,
            tier: normalizedTier,
            source: 'yookassa_webhook_54fz',
          },
          userAgent: req.headers.get('user-agent'),
        });
      } catch {}

      // Оповещение Администратора (Telegram + Email)
      try {
        await notifyNewPayment({
          amount: amountVal || tierConfig.price,
          tierName: tierConfig.name,
          userEmail: targetUser?.email || userEmail || 'Не указан',
          userName: targetUser?.name || 'Клиент',
          paymentId,
        });
      } catch (notifyErr) {
        console.warn('Admin payment notification error:', notifyErr);
      }
    }

    // ЮKassa ожидает HTTP 200 на любое полученное валидное уведомление
    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Yookassa webhook processing error:', error);
    // Возвращаем 200, чтобы не вызывать бесконечные ретраи при сбоях логики
    return NextResponse.json({ success: false, error: 'Internal webhook error' }, { status: 200 });
  }
}
