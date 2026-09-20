import { NextResponse } from 'next/server';
import { fetchAllTiersAsync, getTierList } from '@/lib/db/tiers-store';

export async function GET() {
  try {
    const tiers = await fetchAllTiersAsync();
    const tierList = Object.values(tiers);
    return NextResponse.json({
      success: true,
      tiers,
      tierList,
    });
  } catch (error) {
    console.error('Error fetching public tiers:', error);
    return NextResponse.json({
      success: true,
      tierList: getTierList(),
    });
  }
}
