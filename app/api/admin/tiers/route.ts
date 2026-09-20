import { NextRequest, NextResponse } from 'next/server';
import { getAllTiers, fetchAllTiersAsync, updateTierConfig, saveAllTiers } from '@/lib/db/tiers-store';
import { UserTier } from '@/lib/billing/tiers';

export async function GET() {
  try {
    const tiers = await fetchAllTiersAsync();
    return NextResponse.json({ success: true, tiers });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при получении тарифов' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { tierId, patch, tiers } = body;

    // Поддержка сохранения всего объекта тарифов целиком
    if (tiers && typeof tiers === 'object') {
      saveAllTiers(tiers);
      return NextResponse.json({ success: true, tiers: getAllTiers() });
    }

    if (!tierId || !patch) {
      return NextResponse.json(
        { success: false, error: 'Необходимо указать tierId и изменения patch или полный объект tiers' },
        { status: 400 }
      );
    }

    const updated = updateTierConfig(tierId as UserTier, patch);
    return NextResponse.json({ success: true, tier: updated, tiers: getAllTiers() });
  } catch (error) {
    console.error('Error updating tier:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при обновлении тарифа' },
      { status: 500 }
    );
  }
}
