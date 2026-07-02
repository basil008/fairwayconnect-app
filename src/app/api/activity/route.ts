import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  const result = await db.execute(`
    SELECT a.*, m.name as member_name
    FROM activity_log a
    LEFT JOIN members m ON m.id = a.member_id
    ORDER BY a.created_at DESC
    LIMIT 20
  `);
  const activities = result.rows;

  return NextResponse.json(activities);
}
