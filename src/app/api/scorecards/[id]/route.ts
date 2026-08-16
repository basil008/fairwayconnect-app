import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = getDb();
    
    // Fetch scorecard
    const scorecardResult = await db.execute({
      sql: `SELECT * FROM scorecards WHERE id = ?`,
      args: [id]
    });
    
    if (!scorecardResult.rows || scorecardResult.rows.length === 0) {
      return NextResponse.json({ error: 'Scorecard not found' }, { status: 404 });
    }
    
    const scorecard = scorecardResult.rows[0];
    
    // Fetch hole scores
    const holesResult = await db.execute({
      sql: `SELECT hole_number, gross_score, stableford_points 
            FROM hole_scores 
            WHERE scorecard_id = ? 
            ORDER BY hole_number`,
      args: [id]
    });
    
    return NextResponse.json({
      scorecard,
      holes: holesResult.rows
    });
    
  } catch (error) {
    console.error('❌ Scorecard fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch scorecard',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = getDb();
    
    // Update hole scores
    for (const hole of body.holes) {
      await db.execute({
        sql: `UPDATE hole_scores 
              SET gross_score = ?, stableford_points = ? 
              WHERE scorecard_id = ? AND hole_number = ?`,
        args: [hole.gross_score, hole.stableford_points, id, hole.hole_number]
      });
    }
    
    // Recalculate totals
    const totalPoints = body.holes.reduce((sum: number, h: any) => sum + (h.stableford_points || 0), 0);
    const totalGross = body.holes.reduce((sum: number, h: any) => sum + (h.gross_score || 0), 0);
    const holesCompleted = body.holes.filter((h: any) => h.gross_score > 0).length;
    
    await db.execute({
      sql: `UPDATE scorecards 
            SET total_points = ?, total_gross = ?, holes_completed = ?
            WHERE id = ?`,
      args: [totalPoints, totalGross, holesCompleted, id]
    });
    
    console.log(`✅ Updated scorecard ${id}: ${totalPoints} pts, ${totalGross} gross`);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Scorecard update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update scorecard',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = getDb();
    
    // Delete hole scores first
    await db.execute({
      sql: `DELETE FROM hole_scores WHERE scorecard_id = ?`,
      args: [id]
    });
    
    // Delete scorecard
    await db.execute({
      sql: `DELETE FROM scorecards WHERE id = ?`,
      args: [id]
    });
    
    console.log(`✅ Deleted scorecard ${id}`);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Scorecard delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete scorecard',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
