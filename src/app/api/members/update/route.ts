import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { InValue } from '@libsql/client';

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const fields: string[] = [];
  const values: InValue[] = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.handicap !== undefined) { fields.push('handicap = ?'); values.push(body.handicap); }
  if (body.email !== undefined) { fields.push('email = ?'); values.push(body.email); }
  if (body.phone !== undefined) { fields.push('phone = ?'); values.push(body.phone); }
  if (body.member_type !== undefined) { fields.push('member_type = ?'); values.push(body.member_type); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
  if (body.member_pin !== undefined) { fields.push('member_pin = ?'); values.push(body.member_pin); }
  if (body.pin !== undefined) { fields.push('member_pin = ?'); values.push(body.pin); }

  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  values.push(id);
  await db.execute({
    sql: `UPDATE members SET ${fields.join(', ')} WHERE id = ?`,
    args: values
  });

  // If handicap changed, recalculate Stableford for all in-progress events
  if (body.handicap !== undefined) {
    const { calculateStablefordPoints } = await import('@/lib/stableford');
    // Find all scorecards for this member in non-finalised events
    const scorecardsResult = await db.execute({
      sql: `SELECT sc.id as scorecard_id, sc.event_id, e.slope_rating, e.course_rating, e.course_par, e.handicap_allowance
            FROM scorecards sc JOIN events e ON e.id = sc.event_id
            WHERE sc.member_id = ? AND e.status != 'finalised'`,
      args: [id]
    });
    for (const sc of scorecardsResult.rows) {
      const courseSettings = (sc.slope_rating as number) ? {
        slopeRating: Number(sc.slope_rating) || 113,
        courseRating: Number(sc.course_rating) || 72,
        coursePar: Number(sc.course_par) || 72,
        handicapAllowance: Number(sc.handicap_allowance) || 0.95,
      } : undefined;
      // Get course holes
      const holesResult = await db.execute({
        sql: 'SELECT hole_number, par, stroke_index FROM course_holes WHERE event_id = ? ORDER BY hole_number',
        args: [sc.event_id as string]
      });
      const holes = holesResult.rows as unknown as Array<{hole_number: number; par: number; stroke_index: number}>;
      // Recalculate each hole
      const holeScoresResult = await db.execute({
        sql: 'SELECT id, hole_number, gross_score FROM hole_scores WHERE scorecard_id = ?',
        args: [sc.scorecard_id as string]
      });
      let newTotal = 0;
      for (const hs of holeScoresResult.rows) {
        const hole = holes.find(h => h.hole_number === (hs.hole_number as number));
        if (!hole || !(hs.gross_score as number)) continue;
        const pts = calculateStablefordPoints(hs.gross_score as number, hole.par, hole.stroke_index, Number(body.handicap), courseSettings);
        newTotal += pts;
        await db.execute({ sql: 'UPDATE hole_scores SET stableford_points = ? WHERE id = ?', args: [pts, hs.id as string] });
      }
      // Update scorecard total
      const grossResult = await db.execute({ sql: 'SELECT SUM(gross_score) as total FROM hole_scores WHERE scorecard_id = ?', args: [sc.scorecard_id as string] });
      await db.execute({
        sql: 'UPDATE scorecards SET total_points = ?, total_gross = ? WHERE id = ?',
        args: [newTotal, (grossResult.rows[0] as any)?.total || 0, sc.scorecard_id as string]
      });
    }
  }

  return NextResponse.json({ success: true });
}
