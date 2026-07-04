import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const flaggedOnly = searchParams.get('flagged') === 'true';

  try {
    let sql = `
      SELECT 
        hsl.*,
        m.name as member_name
      FROM handicap_sync_log hsl
      JOIN members m ON hsl.member_id = m.id
    `;

    if (flaggedOnly) {
      sql += ` WHERE ABS(hsl.change_amount) > 2 OR hsl.notes LIKE '%flagged%'`;
    }

    sql += ` ORDER BY hsl.sync_date DESC LIMIT 100`;

    const result = await db.execute(sql);

    return NextResponse.json({
      changes: result.rows
    });

  } catch (error: any) {
    console.error('Handicap changes error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to load changes' 
    }, { status: 500 });
  }
}
