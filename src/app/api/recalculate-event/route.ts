import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateStablefordPoints } from '@/lib/stableford';

export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const db = getDb();

    // Get event details
    const eventResult = await db.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [eventId]
    });
    const event = eventResult.rows[0] as any;
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const handicapAllowance = Number(event.handicap_allowance) || 0.95;
    const slopeRating = Number(event.slope_rating) || 113;
    const courseRating = Number(event.course_rating) || 72;
    const coursePar = Number(event.course_par) || 72;

    console.log(`🔄 Recalculating scores for event: ${event.name}`);
    console.log(`   H/C Allowance: ${(handicapAllowance * 100).toFixed(0)}%`);
    console.log(`   Slope: ${slopeRating}, CR: ${courseRating}, Par: ${coursePar}`);

    // Get all scorecards with member data
    const scorecardsResult = await db.execute({
      sql: `SELECT sc.*, m.name as member_name, m.handicap 
            FROM scorecards sc 
            JOIN members m ON sc.member_id = m.id 
            WHERE sc.event_id = ?`,
      args: [eventId]
    });
    const scorecards = scorecardsResult.rows as any[];

    console.log(`   Found ${scorecards.length} scorecards to recalculate`);

    // Get course holes for par/SI data
    const holesResult = await db.execute({
      sql: 'SELECT * FROM course_holes WHERE event_id = ? ORDER BY hole_number',
      args: [eventId]
    });
    const courseHoles = holesResult.rows as any[];
    const holeMap = new Map(courseHoles.map(h => [h.hole_number, h]));

    let recalculatedCount = 0;

    for (const scorecard of scorecards) {
      const memberHandicap = Number(scorecard.handicap) || 0;

      // Get hole scores for this scorecard
      const scoresResult = await db.execute({
        sql: 'SELECT * FROM hole_scores WHERE scorecard_id = ? ORDER BY hole_number',
        args: [scorecard.id]
      });
      const holeScores = scoresResult.rows as any[];

      if (holeScores.length === 0) continue;

      // Recalculate Stableford points for each hole using WHS settings
      let totalPoints = 0;
      let totalGross = 0;
      let frontNinePoints = 0;
      let backNinePoints = 0;

      for (const score of holeScores) {
        const holeNumber = Number(score.hole_number);
        const grossScore = Number(score.gross_score) || 0;
        const courseHole = holeMap.get(holeNumber);
        
        if (!courseHole) continue;

        const par = Number(courseHole.par) || 4;
        const strokeIndex = Number(courseHole.stroke_index) || 18;

        // Calculate Stableford points using WHS formula
        const points = calculateStablefordPoints(
          grossScore,
          par,
          strokeIndex,
          memberHandicap,
          {
            slopeRating,
            courseRating,
            coursePar,
            handicapAllowance
          }
        );

        // Update hole score
        await db.execute({
          sql: 'UPDATE hole_scores SET stableford_points = ? WHERE id = ?',
          args: [points, score.id]
        });

        totalPoints += points;
        totalGross += grossScore;
        
        if (holeNumber <= 9) {
          frontNinePoints += points;
        } else {
          backNinePoints += points;
        }
      }

      // Update scorecard with recalculated totals
      await db.execute({
        sql: `UPDATE scorecards 
              SET total_gross = ?, 
                  total_points = ?,
                  front_nine_points = ?,
                  back_nine_points = ?
              WHERE id = ?`,
        args: [totalGross, totalPoints, frontNinePoints, backNinePoints, scorecard.id]
      });

      recalculatedCount++;
      console.log(`   ✅ ${scorecard.member_name}: ${totalPoints} pts (was ${scorecard.total_points})`);
    }

    console.log(`🎉 Recalculated ${recalculatedCount} scorecards`);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully recalculated ${recalculatedCount} scorecards`,
      recalculatedCount,
      handicapAllowance: (handicapAllowance * 100).toFixed(0) + '%'
    });

  } catch (error) {
    console.error('❌ Recalculate error:', error);
    return NextResponse.json({ 
      error: 'Failed to recalculate scores',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
