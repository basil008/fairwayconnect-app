import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { calculateStablefordPoints, WHSCourseSettings } from '@/lib/stableford';
import { v4 as uuidv4 } from 'uuid';

async function getCurrentEventId(db: ReturnType<typeof getDb>): Promise<string | undefined> {
  const inProgressResult = await db.execute("SELECT id FROM events WHERE status = 'in_progress' ORDER BY date ASC LIMIT 1");
  if (inProgressResult.rows[0]?.id) return inProgressResult.rows[0].id as string;

  const upcomingResult = await db.execute("SELECT id FROM events WHERE status = 'upcoming' ORDER BY date ASC LIMIT 1");
  if (upcomingResult.rows[0]?.id) return upcomingResult.rows[0].id as string;

  const finalisedResult = await db.execute("SELECT id FROM events WHERE status = 'finalised' ORDER BY date DESC LIMIT 1");
  if (finalisedResult.rows[0]?.id) return finalisedResult.rows[0].id as string;

  return undefined;
}

export async function GET(request: Request) {
  await seedDatabase();
  const db = getDb();
  const url = new URL(request.url);
  const memberId = url.searchParams.get('member_id');
  const eventId = url.searchParams.get('event_id') || await getCurrentEventId(db);

  if (!eventId) return NextResponse.json([]);

  if (memberId) {
    const scorecardResult = await db.execute({
      sql: 'SELECT * FROM scorecards WHERE event_id = ? AND member_id = ?',
      args: [eventId, memberId]
    });
    const scorecard = scorecardResult.rows[0];
    if (!scorecard) return NextResponse.json(null);

    const scoresResult = await db.execute({
      sql: 'SELECT * FROM hole_scores WHERE scorecard_id = ? ORDER BY hole_number',
      args: [(scorecard as unknown as { id: string }).id]
    });
    const scores = scoresResult.rows;
    return NextResponse.json({ ...scorecard, scores });
  }

  const scorecardsResult = await db.execute({
    sql: `
      SELECT s.*, m.name, m.handicap, m.member_type
      FROM scorecards s JOIN members m ON m.id = s.member_id
      WHERE s.event_id = ?
      ORDER BY s.total_points DESC
    `,
    args: [eventId]
  });
  const scorecards = scorecardsResult.rows;
  return NextResponse.json(scorecards);
}

export async function POST(request: Request) {
  await seedDatabase();
  const db = getDb();
  const body = await request.json();
  const { event_id, member_id, scores, entry_method, scan_image_path } = body;

  // Validate that event exists and get WHS settings
  const eventResult = await db.execute({ 
    sql: 'SELECT id, slope_rating, course_rating, course_par, handicap_allowance FROM events WHERE id = ?', 
    args: [event_id] 
  });
  const eventData = eventResult.rows[0] as unknown as { 
    id: string; slope_rating?: number; course_rating?: number; course_par?: number; handicap_allowance?: number 
  } | undefined;
  if (!eventData) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  
  // Build WHS course settings if available
  const courseSettings: WHSCourseSettings | undefined = eventData.slope_rating ? {
    slopeRating: eventData.slope_rating || 113,
    courseRating: eventData.course_rating || 72,
    coursePar: eventData.course_par || 72,
    handicapAllowance: eventData.handicap_allowance || 0.95
  } : undefined;

  const memberExistsResult = await db.execute({ sql: 'SELECT id, handicap FROM members WHERE id = ?', args: [member_id] });
  const memberExists = memberExistsResult.rows[0] as unknown as { id: string; handicap: number } | undefined;
  if (!memberExists) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Get or create scorecard using upsert pattern
  const scorecardResult = await db.execute({
    sql: 'SELECT * FROM scorecards WHERE event_id = ? AND member_id = ?',
    args: [event_id, member_id]
  });
  let scorecard = scorecardResult.rows[0] as unknown as { id: string } | undefined;
  const scorecardId = scorecard?.id || uuidv4();

  if (!scorecard) {
    await db.execute({
      sql: `INSERT INTO scorecards (id, event_id, member_id, status, entry_method, scan_image_path)
            VALUES (?, ?, ?, 'in_progress', ?, ?)`,
      args: [scorecardId, event_id, member_id,
             entry_method || 'manual',
             scan_image_path || null]
    });
  } else if (entry_method === 'scan') {
    await db.execute({
      sql: 'UPDATE scorecards SET entry_method = ?, scan_image_path = ? WHERE id = ?',
      args: [entry_method, scan_image_path || null, scorecardId]
    });
  }

  // Get course holes
  const holesResult = await db.execute({ sql: 'SELECT * FROM course_holes WHERE event_id = ? ORDER BY hole_number', args: [event_id] });
  const holes = holesResult.rows as unknown as Array<{
    hole_number: number; par: number; stroke_index: number; yardage: number;
  }>;

    // Use Golf Ireland handicap index as-is — deductions are applied to POINTS, not handicap
  const handicap = memberExists.handicap;

  // Upsert each hole score
  for (const score of (scores as Array<{ hole_number: number; gross_score: number }>)) {
    const hole = holes.find(h => h.hole_number === score.hole_number);
    if (!hole) continue;

    // Treat blank/null/undefined as 0
    const gross = Number(score.gross_score) || 0;
    const pts = gross > 0 ? calculateStablefordPoints(gross, hole.par, hole.stroke_index, handicap, courseSettings) : 0;

    const existingScoreResult = await db.execute({
      sql: 'SELECT id FROM hole_scores WHERE scorecard_id = ? AND hole_number = ?',
      args: [scorecardId, score.hole_number]
    });
    const existingScore = existingScoreResult.rows[0] as unknown as { id: string } | undefined;

    if (existingScore) {
      await db.execute({
        sql: 'UPDATE hole_scores SET gross_score = ?, stableford_points = ? WHERE id = ?',
        args: [gross, pts, existingScore.id]
      });
    } else {
      await db.execute({
        sql: 'INSERT INTO hole_scores (id, scorecard_id, hole_number, gross_score, stableford_points) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), scorecardId, score.hole_number, gross, pts]
      });
    }
  }

  // Recalculate totals
  const allScoresResult = await db.execute({ sql: 'SELECT * FROM hole_scores WHERE scorecard_id = ?', args: [scorecardId] });
  const allScores = allScoresResult.rows as unknown as Array<{
    gross_score: number; stableford_points: number;
  }>;
  const totGross = allScores.reduce((s, h) => s + (Number(h.gross_score) || 0), 0);
  const totPts = allScores.reduce((s, h) => s + h.stableford_points, 0);
  const isComplete = allScores.length >= 18;

  await db.execute({
    sql: 'UPDATE scorecards SET total_gross = ?, total_points = ?, status = ?, submitted_at = ? WHERE id = ?',
    args: [totGross, totPts,
           isComplete ? 'submitted' : 'in_progress',
           isComplete ? new Date().toISOString() : null,
           scorecardId]
  });

  // Log activity
  if (isComplete) {
    try {
      const memberResult = await db.execute({ sql: 'SELECT name FROM members WHERE id = ?', args: [member_id] });
      const member = memberResult.rows[0] as unknown as { name: string };
      await db.execute({
        sql: 'INSERT INTO activity_log (id, event_id, member_id, action, detail) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), event_id, member_id, 'score_submitted',
               `${member.name} submitted scorecard: ${totPts} pts`]
      });
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ success: true, scorecard_id: scorecardId, total_points: totPts, total_gross: totGross });
}

// PUT - Recalculate all stableford points for an event (used after algorithm fixes)
export async function PUT(request: Request) {
  await seedDatabase();
  const db = getDb();
  const body = await request.json();
  const { event_id } = body;

  if (!event_id) {
    return NextResponse.json({ error: 'event_id required' }, { status: 400 });
  }

  // Get course holes
  const holesResult = await db.execute({ 
    sql: 'SELECT * FROM course_holes WHERE event_id = ? ORDER BY hole_number', 
    args: [event_id] 
  });
  const holes = holesResult.rows as unknown as Array<{
    hole_number: number; par: number; stroke_index: number;
  }>;

  // Get all scorecards for this event
  const scorecardsResult = await db.execute({
    sql: `SELECT s.id, s.member_id, m.handicap 
          FROM scorecards s 
          JOIN members m ON m.id = s.member_id 
          WHERE s.event_id = ?`,
    args: [event_id]
  });
  const scorecards = scorecardsResult.rows as unknown as Array<{
    id: string; member_id: string; handicap: number;
  }>;

  let updated = 0;

  for (const sc of scorecards) {
    // Get all hole scores for this scorecard
    const scoresResult = await db.execute({
      sql: 'SELECT * FROM hole_scores WHERE scorecard_id = ?',
      args: [sc.id]
    });
    const scores = scoresResult.rows as unknown as Array<{
      id: string; hole_number: number; gross_score: number; stableford_points: number;
    }>;

    let totalPoints = 0;

    for (const score of scores) {
      const hole = holes.find(h => h.hole_number === score.hole_number);
      if (!hole) continue;

      const newPts = calculateStablefordPoints(score.gross_score, hole.par, hole.stroke_index, sc.handicap);
      
      if (newPts !== score.stableford_points) {
        await db.execute({
          sql: 'UPDATE hole_scores SET stableford_points = ? WHERE id = ?',
          args: [newPts, score.id]
        });
        updated++;
      }
      totalPoints += newPts;
    }

    // Update scorecard total
    await db.execute({
      sql: 'UPDATE scorecards SET total_points = ? WHERE id = ?',
      args: [totalPoints, sc.id]
    });
  }

  return NextResponse.json({ 
    success: true, 
    scorecards_processed: scorecards.length,
    holes_updated: updated 
  });
}
