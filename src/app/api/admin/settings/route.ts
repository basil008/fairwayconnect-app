import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET() {
  await seedDatabase();
  const db = getDb();
  const result = await db.execute('SELECT key, value FROM society_settings');
  const rows = result.rows as unknown as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  await seedDatabase();
  const db = getDb();
  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    await db.execute({ 
      sql: 'INSERT OR REPLACE INTO society_settings (key, value) VALUES (?, ?)',
      args: [key, String(value)]
    });
  }

  return NextResponse.json({ success: true });
}
