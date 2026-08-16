import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateStablefordPoints, WHSCourseSettings } from '@/lib/stableford';

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json().catch(() => ({}));
  const eventId = body.event_id;

  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

  // Get event WHS settings
  const eventResult = await db.execute({
    sql: 'SELECT slope_rating, course_rating, course_par, handicap_allowance FROM events WHERE id = ?',
    args: [eventId]
  });
  const event = eventResult.rows[0] as Record<string, unknown> | undefined;
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const courseSettings: WHSCourseSettings | undefined = event.slope_rating ? {
    slopeRating: Number(event.slope_rating) || 113,
    courseRating: Number(event.course_rating) || 72,
    coursePar: Number(event.course_par) || 72,
    handicapAllowance: Number(event.handicap_allowance) || 0.95,
  } : undefined;

  // Get course holes
  const holesResult = await db.execute({
    sql: 'SELECT hole_number, par, stroke_index FROM course_holes WHERE event_id = ? ORDER BY hole_number',
    args: [eventId]
  });
  const holes = holesResult.rows as unknown as Array<{ hole_number: number; par: number; stroke_index: number }>;

  if (holes.length === 0) return NextResponse.json({ error: 'No course holes configured' }, { status: 400 });

  // Get all scorecards with member handicaps
  const scorecardsResult = await db.execute({
    sql: `SELECT sc.id, sc.member_id, m.name, m.handicap
          FROM scorecards sc JOIN members m ON m.id = sc.member_id
          WHERE sc.event_id = ?`,
    args: [eventId]
  });

  let updated = 0;
  const results: Array<{ name: string; old_total: number; new_total: number }> = [];

  for (const sc of scorecardsResult.rows) {
    const scorecardId = sc.id as string;
    const handicap = Number(sc.handicap);
    const name = sc.name as string;

    // Get all hole scores
    const scoresResult = await db.execute({
      sql: 'SELECT id, hole_number, gross_score, stableford_points FROM hole_scores WHERE scorecard_id = ? ORDER BY hole_number',
      args: [scorecardId]
    });

    let newTotal = 0;
    let oldTotal = 0;

    for (const hs of scoresResult.rows) {
      const holeNum = hs.hole_number as number;
      const gross = hs.gross_score as number;
      const oldPts = hs.stableford_points as number;
      oldTotal += oldPts;

      const hole = holes.find(h => h.hole_number === holeNum);
      if (!hole || !gross) continue;

      const newPts = calculateStablefordPoints(gross, hole.par, hole.stroke_index, handicap, courseSettings);
      newTotal += newPts;

      if (newPts !== oldPts) {
        await db.execute({
          sql: 'UPDATE hole_scores SET stableford_points = ? WHERE id = ?',
          args: [newPts, hs.id as string]
        });
      }
    }

    // Update scorecard totals
    const totalGrossResult = await db.execute({
      sql: 'SELECT SUM(gross_score) as total FROM hole_scores WHERE scorecard_id = ?',
      args: [scorecardId]
    });
    const totalGross = (totalGrossResult.rows[0] as any)?.total || 0;

    await db.execute({
      sql: 'UPDATE scorecards SET total_points = ?, total_gross = ? WHERE id = ?',
      args: [newTotal, totalGross, scorecardId]
    });

    if (oldTotal !== newTotal) {
      updated++;
      results.push({ name, old_total: oldTotal, new_total: newTotal });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Recalculated ${scorecardsResult.rows.length} scorecards. ${updated} scores changed.`,
    changes: results
  });
}
