import { NextRequest, NextResponse } from 'next/server';
import { UserTier, TIER_CONFIGS, getTierConfig } from '@/lib/billing/tiers';
import { findUserByEmail, findUserById, updateUser } from '@/lib/db/users-store';
import { recordTelemetryEvent } from '@/lib/db/telemetry-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, userId, userEmail } = body;

    const validTiers: string[] = ['EXPRESS_SINGLE', 'EXPRESS_PACK', 'PRO', 'MAX', 'CORP', 'EXPRESS'];
    if (!tier || !validTiers.includes(tier)) {
      return NextResponse.json({ success: false, error: 'Неверный тариф' }, { status: 400 });
    }

    const normalizedTier: UserTier = tier === 'EXPRESS' ? 'EXPRESS_PACK' : (tier as UserTier);
    const tierConfig = TIER_CONFIGS[normalizedTier] || TIER_CONFIGS.PRO;
    const amount = tierConfig.price;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Запись в телеметрию
    try {
      await recordTelemetryEvent({
        visitorId: `vis_${(userId || 'guest').substring(0, 12)}`,
        userId: userId || null,
        eventName: 'payment_completed',
        pagePath: '/dashboard',
        metadata: { tier: normalizedTier, amount, paymentId },
        userAgent: req.headers.get('user-agent'),
      });
    } catch {}

    // Обновляем статус пользователя в хранилище при оплате
    if (userId || userEmail) {
      const targetUser = userId ? await findUserById(userId) : (userEmail ? await findUserByEmail(userEmail) : null);
      if (targetUser) {
        await updateUser(targetUser.id, {
          tier: normalizedTier,
          hasPaid: true,
          reportsLimit: tierConfig.reportsLimit,
          revenue: (targetUser.revenue || 0) + amount,
          lastActive: new Date().toISOString().split('T')[0],
        });
      }
    }

    // Логика интеграции с ЮKassa (или Sandbox)
    const yookassaShopId = process.env.YOOKASSA_SHOP_ID;
    const yookassaSecretKey = process.env.YOOKASSA_SECRET_KEY;

    let paymentUrl = null;

    if (yookassaShopId && yookassaSecretKey) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${yookassaShopId}:${yookassaSecretKey}`).toString('base64');
        const yooRes = await fetch('https://api.yookassa.ru/v3/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotence-Key': paymentId,
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            amount: {
              value: amount.toFixed(2),
              currency: 'RUB',
            },
            capture: true,
            confirmation: {
              type: 'redirect',
              return_url: `${req.nextUrl.origin}/dashboard?payment=success&tier=${normalizedTier}`,
            },
            description: `Оплата тарифа ${tierConfig.name} в сервисе Cransys`,
          }),
        });

        const yooData = await yooRes.json();
        if (yooData?.confirmation?.confirmation_url) {
          paymentUrl = yooData.confirmation.confirmation_url;
        }
      } catch (err) {
        console.warn('Yookassa API call error, fallback to sandbox:', err);
      }
    }

    return NextResponse.json({
      success: true,
      paymentId,
      tier: normalizedTier,
      amount,
      currency: 'RUB',
      paymentUrl,
      sandbox: !paymentUrl,
      message: `Тариф ${tierConfig.name} успешно оформлен`,
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при обработке платежа' },
      { status: 500 }
    );
  }
}
