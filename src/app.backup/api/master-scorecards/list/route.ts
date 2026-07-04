import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    const scorecards = await db.execute({
      sql: `SELECT 
              course_name, 
              tee_color, 
              COUNT(*) as holes,
              SUM(par) as total_par,
              SUM(yardage) as total_yards
            FROM master_course_holes
            GROUP BY course_name, tee_color
            ORDER BY course_name, tee_color`,
      args: []
    });

    return NextResponse.json({
      success: true,
      scorecards: scorecards.rows
    });

  } catch (error) {
    console.error('Error listing master scorecards:', error);
    return NextResponse.json(
      { error: 'Failed to list scorecards' },
      { status: 500 }
    );
  }
}
