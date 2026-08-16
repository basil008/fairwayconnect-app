import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json().catch(() => ({}));
  
  let eventId = body.event_id;
  if (!eventId) {
    const inProgressResult = await db.execute("SELECT id FROM events WHERE status = 'in_progress' ORDER BY date ASC LIMIT 1");
    eventId = inProgressResult.rows[0]?.id as string;

    if (!eventId) {
      const finalisedResult = await db.execute("SELECT id FROM events WHERE status = 'finalised' ORDER BY date DESC LIMIT 1");
      eventId = finalisedResult.rows[0]?.id as string;
    }

    if (!eventId) {
      const upcomingResult = await db.execute("SELECT id FROM events WHERE status = 'upcoming' ORDER BY date ASC LIMIT 1");
      eventId = upcomingResult.rows[0]?.id as string;
    }
  }

  if (!eventId) return NextResponse.json({ error: 'No event found' }, { status: 404 });

  // Delete hole scores for this event's scorecards
  await db.execute({
    sql: `
      DELETE FROM hole_scores WHERE scorecard_id IN (
        SELECT id FROM scorecards WHERE event_id = ?
      )
    `,
    args: [eventId]
  });

  // Delete scorecards
  await db.execute({ sql: 'DELETE FROM scorecards WHERE event_id = ?', args: [eventId] });

  // Delete prize allocations
  await db.execute({ sql: 'DELETE FROM prize_allocations WHERE event_id = ?', args: [eventId] });

  // Reset event status
  await db.execute({
    sql: "UPDATE events SET status = 'in_progress', results_published = 0 WHERE id = ?",
    args: [eventId]
  });

  return NextResponse.json({ success: true });
}
