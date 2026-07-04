import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json().catch(() => ({}));
  const eventId = body.event_id;

  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

  // Get event details
  const eventResult = await db.execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [eventId] });
  const event = eventResult.rows[0] as Record<string, unknown> | undefined;
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const eventNumber = (event.event_number as number) || 1;
  const outingCol = `outing_${eventNumber}`;
  const year = new Date().getFullYear();
  const courseName = event.course_name as string;

  // 1. Delete hole scores for this event
  await db.execute({
    sql: 'DELETE FROM hole_scores WHERE scorecard_id IN (SELECT id FROM scorecards WHERE event_id = ?)',
    args: [eventId]
  });

  // 2. Delete scorecards
  await db.execute({ sql: 'DELETE FROM scorecards WHERE event_id = ?', args: [eventId] });

  // 3. Delete prize allocations
  await db.execute({ sql: 'DELETE FROM prize_allocations WHERE event_id = ?', args: [eventId] });

  // 4. Delete GOTY points
  await db.execute({ sql: 'DELETE FROM goty_points WHERE event_id = ?', args: [eventId] });

  // 5. Delete side comps
  await db.execute({ sql: 'DELETE FROM side_comps WHERE event_id = ?', args: [eventId] });

  // 6. Reset outing deductions column to 0
  await db.execute({
    sql: `UPDATE member_deductions SET ${outingCol} = 0 WHERE year = ?`,
    args: [year]
  });

  // 7. Reset event status to upcoming
  await db.execute({
    sql: "UPDATE events SET status = 'upcoming', results_published = 0 WHERE id = ?",
    args: [eventId]
  });

  // 8. Log the reset
  await db.execute({
    sql: 'INSERT INTO activity_log (id, event_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [uuidv4(), eventId, 'event_full_reset',
      `Full reset of ${courseName}: scores, prizes, GOTY, side comps, outing ${eventNumber} deductions cleared. Tee times and RSVPs preserved.`,
      new Date().toISOString()]
  });

  return NextResponse.json({
    success: true,
    message: `${courseName} fully reset to Upcoming.\n\nCleared: scorecards, prizes, GOTY points, side comps, outing ${eventNumber} deductions.\nPreserved: tee times, RSVPs, course setup.`
  });
}
