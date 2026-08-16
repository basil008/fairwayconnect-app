import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  
  if (!eventId) {
    return NextResponse.json({ error: 'event_id required' }, { status: 400 });
  }

  // Same query as finalise
  const twosResult = await db.execute({
    sql: `
      SELECT hs.hole_number, hs.gross_score, sc.member_id, sc.status as scorecard_status, m.name
      FROM hole_scores hs
      JOIN scorecards sc ON hs.scorecard_id = sc.id
      JOIN members m ON sc.member_id = m.id
      WHERE sc.event_id = ? AND hs.gross_score = 2 AND sc.status = 'submitted'
      ORDER BY hs.hole_number, m.name
    `,
    args: [eventId]
  });

  return NextResponse.json({
    query: 'SELECT ... WHERE sc.event_id = ? AND hs.gross_score = 2 AND sc.status = submitted',
    event_id: eventId,
    found_count: twosResult.rows.length,
    twos: twosResult.rows
  });
}
