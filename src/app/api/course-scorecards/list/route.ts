import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    const scorecards = await db.execute({
      sql: `SELECT 
              course_name, 
              COUNT(*) as holes,
              SUM(par) as total_par
            FROM course_scorecards
            GROUP BY course_name
            ORDER BY course_name`,
      args: []
    });

    return NextResponse.json({
      success: true,
      scorecards: scorecards.rows
    });

  } catch (error) {
    console.error('Error listing course scorecards:', error);
    return NextResponse.json(
      { error: 'Failed to list scorecards' },
      { status: 500 }
    );
  }
}
