import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Publicly safe society settings. NEVER add credentials to this list. */
const PUBLIC_KEYS = [
  'society_name',
  'captain',
  'secretary',
  'treasurer',
  'default_fee',
  'default_format',
  'member_score_entry',
];

export async function GET() {
  const db = getDb();
  const placeholders = PUBLIC_KEYS.map(() => '?').join(', ');
  const result = await db.execute({
    sql: `SELECT key, value FROM society_settings WHERE key IN (${placeholders})`,
    args: PUBLIC_KEYS,
  });
  const settings: Record<string, string> = {};
  for (const row of result.rows as unknown as Array<{ key: string; value: string }>) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}
