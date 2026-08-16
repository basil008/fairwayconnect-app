import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    const eventId = '6e52d8e4-94ae-467d-881c-5bda4b12e180'; // Hollywood Lakes
    const memberId = '39ee4bf8-1efc-4507-9b2a-d017f99c4cc8'; // Terry Creely
    
    // Create scorecard
    const scorecardId = `sc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.execute({
      sql: `INSERT INTO scorecards (
        id, event_id, member_id, handicap, adjusted_handicap,
        total_points, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [scorecardId, eventId, memberId, 20.3, 20.3, 0]
    });
    
    // Create hole scores (all zeros initially)
    const holes = await db.execute({
      sql: 'SELECT id, hole_number FROM course_holes WHERE event_id = ? ORDER BY hole_number',
      args: [eventId]
    });
    
    for (const hole of holes.rows) {
      const holeScoreId = `hs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.execute({
        sql: `INSERT INTO hole_scores (
          id, scorecard_id, hole_id, hole_number, strokes, points
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [holeScoreId, scorecardId, (hole as any).id, (hole as any).hole_number, 0, 0]
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Created blank scorecard for Terry Creely',
      scorecardId 
    });
    
  } catch (error) {
    console.error('Error creating scorecard:', error);
    return NextResponse.json({ 
      error: 'Failed to create scorecard',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
