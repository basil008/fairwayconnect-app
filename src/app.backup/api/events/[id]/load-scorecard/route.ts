import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST: Copy master scorecard to event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { courseName } = body;

    if (!courseName) {
      return NextResponse.json(
        { error: 'Missing courseName' },
        { status: 400 }
      );
    }

    const db = getDb();

    // 1. Fetch course scorecard (no tee needed - same for all)
    const masterHoles = await db.execute({
      sql: `SELECT hole_number, par, stroke_index 
            FROM course_scorecards 
            WHERE course_name = ?
            ORDER BY hole_number`,
      args: [courseName]
    });

    if (masterHoles.rows.length !== 18) {
      return NextResponse.json(
        { error: `Scorecard not found or incomplete (${masterHoles.rows.length}/18 holes)` },
        { status: 404 }
      );
    }

    // 2. Delete existing event holes (if any)
    await db.execute({
      sql: 'DELETE FROM course_holes WHERE event_id = ?',
      args: [eventId]
    });

    // 3. Copy scorecard holes to event (yardage set to 0 - not needed for scoring)
    for (const hole of masterHoles.rows) {
      await db.execute({
        sql: `INSERT INTO course_holes 
              (id, event_id, hole_number, par, stroke_index, yardage)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          `ch-${eventId}-${hole.hole_number}`,
          eventId,
          hole.hole_number,
          hole.par,
          hole.stroke_index,
          0  // Yardage not needed
        ]
      });
    }

    // 4. Fetch metadata
    let metadata = null;
    try {
      const metadataResult = await db.execute({
        sql: 'SELECT slope_rating, course_rating, tee_color FROM course_scorecard_metadata WHERE course_name = ?',
        args: [courseName]
      });
      if (metadataResult.rows.length > 0) {
        metadata = metadataResult.rows[0];
      }
    } catch (error) {
      console.log('No metadata found for', courseName);
    }

    // 5. If metadata exists, update the event record
    if (metadata) {
      await db.execute({
        sql: `UPDATE events 
              SET course_name = ?, course_par = ?, slope_rating = ?, course_rating = ?, tee_color = ?
              WHERE id = ?`,
        args: [
          courseName,
          masterHoles.rows.reduce((sum: number, h: any) => sum + h.par, 0),
          metadata.slope_rating,
          metadata.course_rating,
          metadata.tee_color,
          eventId
        ]
      });
      console.log('✅ Updated event with scorecard metadata + course name + tee color');
    }

    // 6. Calculate and return totals
    const totalPar = masterHoles.rows.reduce((sum: number, h: any) => sum + h.par, 0);

    return NextResponse.json({
      success: true,
      message: `Loaded ${masterHoles.rows.length} holes from ${courseName}`,
      totals: {
        par: totalPar,
        holes: masterHoles.rows.length
      },
      metadata
    });

  } catch (error) {
    console.error('Error loading scorecard to event:', error);
    return NextResponse.json(
      { error: 'Failed to load scorecard' },
      { status: 500 }
    );
  }
}
