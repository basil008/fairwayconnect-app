import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    
    console.log('Starting Ashbourne metadata fix...');
    
    // Fix metadata table
    const result1 = await db.execute({
      sql: `UPDATE course_scorecard_metadata 
            SET slope_rating = ?, course_rating = ?
            WHERE course_name = ?`,
      args: [130, 72.2, 'Ashbourne Golf Club']
    });
    console.log('✅ Updated course_scorecard_metadata:', result1);
    
    // Fix events table
    const result2 = await db.execute({
      sql: `UPDATE events 
            SET slope_rating = ?, course_rating = ?
            WHERE date = ?`,
      args: [130, 72.2, '2026-05-18']
    });
    console.log('✅ Updated events table:', result2);
    
    // Verify the fix
    const verify = await db.execute({
      sql: `SELECT course_name, slope_rating, course_rating, tee_color 
            FROM course_scorecard_metadata 
            WHERE course_name = ?`,
      args: ['Ashbourne Golf Club']
    });
    
    return NextResponse.json({
      success: true,
      message: 'Ashbourne WHS values corrected: Slope 130, CR 72.2',
      metadata: verify.rows[0]
    });
    
  } catch (error: any) {
    console.error('Fix error:', error);
    return NextResponse.json(
      { error: error.message || 'Fix failed' },
      { status: 500 }
    );
  }
}
