import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: id } = await params;
  const db = getDb();
  
  // Get limit from query params (default 3)
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '3');

  try {
    const result = await db.execute({
      sql: `SELECT * FROM handicap_sync_log 
            WHERE member_id = ? 
            ORDER BY sync_date DESC 
            LIMIT ?`,
      args: [id, limit]
    });

    return NextResponse.json({
      history: result.rows
    });

  } catch (error: any) {
    console.error('Handicap history error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to load history' 
    }, { status: 500 });
  }
}
