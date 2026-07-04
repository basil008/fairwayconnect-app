import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;

  const memberResult = await db.execute({ sql: 'SELECT * FROM members WHERE id = ?', args: [id] });
  const member = memberResult.rows[0] as Record<string, unknown> | undefined;
  if (!member) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

  const seasonResult = await db.execute("SELECT * FROM seasons WHERE status = 'active' ORDER BY year DESC LIMIT 1");
  const season = seasonResult.rows[0] as Record<string, unknown> | undefined;
  const seasonId = (season?.id as string) || '';

  let standing = null;
  if (seasonId) {
    const standingResult = await db.execute({
      sql: 'SELECT * FROM season_standings WHERE season_id = ? AND member_id = ?',
      args: [seasonId, id]
    });
    standing = standingResult.rows[0];
  }

  let eventStats: Array<Record<string, unknown>> = [];
  if (seasonId) {
    const eventStatsResult = await db.execute({
      sql: `
        SELECT pes.*, e.name as event_name, e.course_name, e.date, e.format
        FROM player_event_stats pes
        JOIN events e ON e.id = pes.event_id
        WHERE pes.member_id = ? AND e.season_id = ?
        ORDER BY e.date
      `,
      args: [id, seasonId]
    });
    eventStats = eventStatsResult.rows as unknown as Array<Record<string, unknown>>;
  }

  return NextResponse.json({
    player: {
      id: member.id,
      name: member.name,
      handicap: member.handicap,
      member_type: member.member_type,
    },
    standing,
    event_stats: eventStats.map(es => ({
      ...es,
      prizes_won: es.prizes_won || '[]',
    })),
  });
}
