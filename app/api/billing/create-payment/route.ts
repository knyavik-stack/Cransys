import { NextRequest, NextResponse } from 'next/server';
import { UserTier, TIER_CONFIGS } from '@/lib/billing/tiers';
import { fetchAllTiersAsync } from '@/lib/db/tiers-store';
import { fetchSiteSettingsAsync } from '@/lib/db/site-settings-store';
import { findUserByEmail, findUserById, updateUser } from '@/lib/db/users-store';
import { recordTelemetryEvent } from '@/lib/db/telemetry-store';
import { notifyNewPayment } from '@/lib/notifications/admin-notify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, userId, userEmail } = body;

    const validTiers: string[] = ['EXPRESS_SINGLE', 'EXPRESS_PACK', 'PRO', 'MAX', 'CORP', 'EXPRESS'];
    if (!tier || !validTiers.includes(tier)) {
      return NextResponse.json({ success: false, error: 'Неверный тариф' }, { status: 400 });
    }

    const normalizedTier: UserTier = tier === 'EXPRESS' ? 'EXPRESS_PACK' : (tier as UserTier);
    
    // Загружаем актуальные настройки тарифов из базы данных
    const allTiers = await fetchAllTiersAsync();
    const tierConfig = allTiers[normalizedTier] || TIER_CONFIGS[normalizedTier] || TIER_CONFIGS.PRO;
    const amount = Number(tierConfig.price) || 0;
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

    // Мгновенное оповещение администратора/собственника об оформлении платежа
    try {
      await notifyNewPayment({
        paymentId,
        amountRub: amount,
        tierName: tierConfig.name,
        userEmail: userEmail || undefined,
      });
    } catch (e) {
      console.warn('Admin payment notification skipped:', e);
    }

    // Загрузка настроек ЮKassa из панели управления
    const siteSettings = await fetchSiteSettingsAsync();
    const yooSettings = siteSettings.yookassa;

    const yookassaShopId = (yooSettings?.shopId || process.env.YOOKASSA_SHOP_ID || '').trim();
    const yookassaSecretKey = (yooSettings?.secretKey || process.env.YOOKASSA_SECRET_KEY || '').trim();
    const isYooEnabled = yooSettings?.enabled !== false;

    let paymentUrl = null;
    let yooError: string | null = null;

    if (isYooEnabled && yookassaShopId && yookassaSecretKey) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${yookassaShopId}:${yookassaSecretKey}`).toString('base64');
        const description = (yooSettings?.descriptionTemplate || 'Оплата тарифа {{tierName}} в сервисе Cransys')
          .replace('{{tierName}}', tierConfig.name);

        const yooPayload: any = {
          amount: {
            value: amount.toFixed(2),
            currency: 'RUB',
          },
          capture: yooSettings?.autoCapture !== false,
          confirmation: {
            type: 'redirect',
            return_url: `${req.nextUrl.origin}/dashboard?payment=success&tier=${normalizedTier}&paymentId=${paymentId}`,
          },
          description,
          metadata: {
            paymentId,
            userId: userId || '',
            userEmail: userEmail || '',
            tier: normalizedTier,
          },
        };

        // Поддержка фискализации по 54-ФЗ (онлайн-чек)
        if (yooSettings?.receiptEnabled && userEmail) {
          yooPayload.receipt = {
            customer: {
              email: userEmail,
            },
            tax_system_code: yooSettings.taxSystemCode || 2, // 2: УСН доход
            items: [
              {
                description: `Доступ к сервису Cransys (${tierConfig.name})`,
                quantity: '1.00',
                amount: {
                  value: amount.toFixed(2),
                  currency: 'RUB',
                },
                vat_code: yooSettings.vatCode || 1, // 1: Без НДС
                payment_mode: 'full_prepayment',
                payment_subject: 'service',
              },
            ],
          };
        }

        const yooRes = await fetch('https://api.yookassa.ru/v3/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotence-Key': paymentId,
            'Authorization': authHeader,
          },
          body: JSON.stringify(yooPayload),
        });

        const yooData = await yooRes.json();
        if (yooRes.ok && yooData?.confirmation?.confirmation_url) {
          paymentUrl = yooData.confirmation.confirmation_url;
        } else {
          yooError = yooData?.description || yooData?.message || 'Ошибка ответа от ЮKassa';
          console.warn('Yookassa returned error:', yooData);
        }
      } catch (err: any) {
        yooError = err?.message || 'Ошибка сети при обращении к ЮKassa';
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
      yookassaActive: Boolean(paymentUrl),
      yookassaError: yooError,
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
