import { NextResponse } from 'next/server';
import { initializeDatabaseSchema, isDatabaseConfigured } from '@/db';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        message: 'DATABASE_URL не задан или не является валидной строкой postgres.',
      },
      { status: 200 }
    );
  }

  const result = await initializeDatabaseSchema();
  return NextResponse.json({
    configured: true,
    ...result,
  });
}

export async function POST() {
  const result = await initializeDatabaseSchema();
  return NextResponse.json(result);
}
