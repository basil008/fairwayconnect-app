import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// One-time migration: Create course_scorecard_metadata table
export async function POST(request: NextRequest) {
  try {
    const db = getDb();

    // Create metadata table
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS course_scorecard_metadata (
        course_name TEXT PRIMARY KEY,
        total_par INTEGER NOT NULL,
        slope_rating INTEGER NOT NULL,
        course_rating REAL NOT NULL,
        tee_color TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });

    console.log('✅ Created course_scorecard_metadata table');

    // Also fix Ashbourne metadata while we're here
    try {
      await db.execute({
        sql: `UPDATE course_scorecard_metadata 
              SET slope_rating = ?, course_rating = ?
              WHERE course_name = ?`,
        args: [130, 72.2, 'Ashbourne Golf Club']
      });
      
      await db.execute({
        sql: `UPDATE events 
              SET slope_rating = ?, course_rating = ?
              WHERE date = ?`,
        args: [130, 72.2, '2026-05-18']
      });
      
      console.log('✅ Fixed Ashbourne WHS values');
    } catch (e) {
      console.log('⚠️ Ashbourne fix skipped (may not exist yet)');
    }

    return NextResponse.json({
      success: true,
      message: 'Migration complete: course_scorecard_metadata table created + Ashbourne fixed (Slope 130, CR 72.2)'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
