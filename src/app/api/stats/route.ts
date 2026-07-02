import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  const totalMembersResult = await db.execute("SELECT COUNT(*) as c FROM members WHERE member_type = 'member'");
  const totalMembers = Number(totalMembersResult.rows[0]?.c) || 0;

  const totalVisitorsResult = await db.execute("SELECT COUNT(*) as c FROM members WHERE member_type = 'visitor'");
  const totalVisitors = Number(totalVisitorsResult.rows[0]?.c) || 0;

  const totalEventsResult = await db.execute('SELECT COUNT(*) as c FROM events');
  const totalEvents = Number(totalEventsResult.rows[0]?.c) || 0;

  const avgScoreResult = await db.execute(`
    SELECT AVG(total_points) as avg_pts FROM scorecards WHERE status = 'submitted'
  `);
  const avgPts = avgScoreResult.rows[0]?.avg_pts;

  // Get the current active event (in_progress first, then most recent with scorecards)
  const inProgressResult = await db.execute("SELECT id FROM events WHERE status = 'in_progress' ORDER BY date DESC LIMIT 1");
  let eventId = inProgressResult.rows[0]?.id as string;

  if (!eventId) {
    const finalisedResult = await db.execute("SELECT id FROM events WHERE status = 'finalised' ORDER BY date DESC LIMIT 1");
    eventId = finalisedResult.rows[0]?.id as string;
  }

  let eventStats = null;
  if (eventId) {
    const submittedResult = await db.execute({
      sql: "SELECT COUNT(*) as c FROM scorecards WHERE event_id = ? AND status = 'submitted'",
      args: [eventId]
    });
    const submitted = Number(submittedResult.rows[0]?.c) || 0;

    const inProgressCountResult = await db.execute({
      sql: "SELECT COUNT(*) as c FROM scorecards WHERE event_id = ? AND status = 'in_progress'",
      args: [eventId]
    });
    const inProgress = Number(inProgressCountResult.rows[0]?.c) || 0;

    const confirmedResult = await db.execute({
      sql: "SELECT COUNT(*) as c FROM rsvps WHERE event_id = ? AND status = 'confirmed'",
      args: [eventId]
    });
    const confirmed = Number(confirmedResult.rows[0]?.c) || 0;

    const visitorCountResult = await db.execute({
      sql: `
        SELECT COUNT(*) as c FROM rsvps r
        JOIN members m ON m.id = r.member_id
        WHERE r.event_id = ? AND r.status = 'confirmed' AND m.member_type = 'visitor'
      `,
      args: [eventId]
    });
    const visitorCount = Number(visitorCountResult.rows[0]?.c) || 0;

    eventStats = { submitted, inProgress, confirmed, visitorCount };
  }

  return NextResponse.json({
    totalMembers,
    totalVisitors,
    totalEvents,
    averageScore: avgPts ? Math.round(Number(avgPts)) : null,
    eventStats,
  });
}
