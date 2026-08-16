import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function POST(request: Request) {
  await seedDatabase();
  const db = getDb();
  const { pin } = await request.json();

  const result = await db.execute({ sql: 'SELECT value FROM society_settings WHERE key = ?', args: ['admin_pin'] });
  const setting = result.rows[0] as unknown as { value: string } | undefined;
  const correctPin = setting?.value || '2026';

  if (pin === correctPin) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false }, { status: 401 });
}
