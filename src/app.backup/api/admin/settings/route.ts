import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Admin settings. Protected by middleware (admin session required).
 * Defence-in-depth: admin_pin is still never returned by GET — writes only.
 */
const SECRET_KEYS = new Set(['admin_pin']);

export async function GET() {
  const db = getDb();
  const result = await db.execute('SELECT key, value FROM society_settings');
  const rows = result.rows as unknown as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  for (const row of rows) {
    if (SECRET_KEYS.has(row.key)) continue;
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const db = getDb();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  for (const [key, value] of Object.entries(body)) {
    // Refuse to blank the admin PIN by accident
    if (key === 'admin_pin' && !String(value).trim()) continue;
    await db.execute({
      sql: 'INSERT OR REPLACE INTO society_settings (key, value) VALUES (?, ?)',
      args: [key, String(value)],
    });
  }

  return NextResponse.json({ success: true });
}
