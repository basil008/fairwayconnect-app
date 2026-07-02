import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getDb();
  const { id } = await params;

  const eventResult = await client.execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [id] });
  const event = eventResult.rows[0];
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const holesResult = await client.execute({ 
    sql: 'SELECT * FROM course_holes WHERE event_id = ? ORDER BY hole_number', 
    args: [id] 
  });
  const holes = holesResult.rows;

  const rsvpCountsResult = await client.execute({
    sql: 'SELECT status, COUNT(*) as count FROM rsvps WHERE event_id = ? GROUP BY status',
    args: [id]
  });
  const rsvpCounts = rsvpCountsResult.rows;
  const confirmedCount = (rsvpCounts as unknown as Array<{status:string;count:number}>).find(r => r.status === 'confirmed')?.count || 0;

  // Leaderboard and prizes for finalised events
  let leaderboard: Array<Record<string, unknown>> = [];
  let prizes: Array<Record<string, unknown>> = [];
  let sideComps: Array<Record<string, unknown>> = [];

  if (event.status === 'finalised') {
    const leaderboardResult = await client.execute({
      sql: `SELECT s.id as scorecard_id, s.member_id, s.status, s.total_gross, s.total_points,
             m.name, m.handicap, m.member_type,
             (SELECT COUNT(*) FROM hole_scores WHERE scorecard_id = s.id) as holes_played
      FROM scorecards s
      JOIN members m ON m.id = s.member_id
      WHERE s.event_id = ?
      ORDER BY s.total_points DESC, s.total_gross ASC`,
      args: [id]
    });
    leaderboard = leaderboardResult.rows as unknown as Array<Record<string, unknown>>;

    let pos = 0;
    let lastPts = -1;
    leaderboard = leaderboard.map((entry, idx) => {
      if (entry.total_points !== lastPts) pos = idx + 1;
      lastPts = entry.total_points as number;
      return { ...entry, position: pos, thru: 'F' };
    });

    const prizesResult = await client.execute({
      sql: `SELECT pa.*, m.name as member_name, m.handicap
      FROM prize_allocations pa
      JOIN members m ON m.id = pa.member_id
      WHERE pa.event_id = ?
      ORDER BY 
        CASE pa.prize_type 
          WHEN 'overall' THEN 1 
          WHEN 'division_a' THEN 2 
          WHEN 'division_b' THEN 3 
          WHEN 'best_visitor' THEN 4
          WHEN 'ntp' THEN 5 
          WHEN 'longest_drive' THEN 6 
        END,
        pa.position`,
      args: [id]
    });
    prizes = prizesResult.rows as unknown as Array<Record<string, unknown>>;

    const sideCompsResult = await client.execute({
      sql: `SELECT sc.*, m.name as player_name
      FROM side_comps sc JOIN members m ON m.id = sc.member_id
      WHERE sc.event_id = ?`,
      args: [id]
    });
    sideComps = sideCompsResult.rows as unknown as Array<Record<string, unknown>>;
  }

  return NextResponse.json({
    event: {
      ...event,
      prize_config: event.prize_config ? JSON.parse(event.prize_config as string) : null,
    },
    holes,
    confirmed_count: confirmedCount,
    leaderboard,
    prizes,
    side_comps: sideComps,
  });
}
