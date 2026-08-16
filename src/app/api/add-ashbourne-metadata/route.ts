import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    
    // Add Ashbourne metadata to course_scorecard_metadata table
    await db.execute({
      sql: `INSERT INTO course_scorecard_metadata (course_name, slope_rating, course_rating, tee_color)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(course_name) DO UPDATE SET
              slope_rating = excluded.slope_rating,
              course_rating = excluded.course_rating,
              tee_color = excluded.tee_color`,
      args: [
        'Ashbourne Golf Club',
        130,
        72.2,
        'White'
      ]
    });
    
    // Also immediately update the Ashbourne event
    await db.execute({
      sql: `UPDATE events 
            SET course_name = ?, 
                course_par = ?, 
                slope_rating = ?, 
                course_rating = ?
            WHERE date = '2026-05-18'`,
      args: [
        'Ashbourne Golf Club',
        71,
        130,
        72.2
      ]
    });
    
    console.log('✅ Added Ashbourne metadata AND fixed event');
    
    return NextResponse.json({
      success: true,
      message: 'Ashbourne metadata added to database. Load Scorecard will now work for all future events!'
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed', details: error },
      { status: 500 }
    );
  }
}
