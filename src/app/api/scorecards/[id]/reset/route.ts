import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = getDb();
    
    // Reset all hole scores to 0
    await db.execute({
      sql: `UPDATE hole_scores 
            SET gross_score = 0, stableford_points = 0 
            WHERE scorecard_id = ?`,
      args: [id]
    });
    
    // Reset scorecard totals and status
    await db.execute({
      sql: `UPDATE scorecards 
            SET total_points = 0, 
                total_gross = 0, 
                front_nine_points = 0,
                back_nine_points = 0,
                status = 'in_progress' 
            WHERE id = ?`,
      args: [id]
    });
    
    console.log(`✅ Reset scorecard ${id} to empty`);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Scorecard reset error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset scorecard',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
