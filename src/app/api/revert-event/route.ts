import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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

  // 1. Delete prize allocations for this event
  await db.execute({ sql: 'DELETE FROM prize_allocations WHERE event_id = ?', args: [eventId] });

  // 2. Delete GOTY points for this event
  await db.execute({ sql: 'DELETE FROM goty_points WHERE event_id = ?', args: [eventId] });

  // 3. Reset deductions for this outing column to 0
  await db.execute({
    sql: `UPDATE member_deductions SET ${outingCol} = 0 WHERE year = ?`,
    args: [year]
  });

  // 4. Reset event status to in_progress (or upcoming if no scorecards)
  const scorecardsResult = await db.execute({
    sql: 'SELECT COUNT(*) as c FROM scorecards WHERE event_id = ?',
    args: [eventId]
  });
  const hasScores = Number((scorecardsResult.rows[0] as any)?.c) > 0;

  await db.execute({
    sql: `UPDATE events SET status = ?, results_published = 0 WHERE id = ?`,
    args: [hasScores ? 'in_progress' : 'upcoming', eventId]
  });

  // 5. Log the revert
  const { v4: uuidv4 } = await import('uuid');
  await db.execute({
    sql: 'INSERT INTO activity_log (id, event_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [uuidv4(), eventId, 'event_reverted',
      `Event reverted to ${hasScores ? 'in_progress' : 'upcoming'}. Prizes, GOTY points, and outing ${eventNumber} deductions cleared.`,
      new Date().toISOString()]
  });

  return NextResponse.json({
    success: true,
    message: `Event reverted to ${hasScores ? 'In Progress' : 'Upcoming'}. Prizes, GOTY points, and outing ${eventNumber} deductions have been cleared. Scorecards are preserved.`
  });
}
