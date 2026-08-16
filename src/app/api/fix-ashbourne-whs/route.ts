import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    
    // Update Ashbourne event (ID 8 or find by name/date)
    await db.execute({
      sql: `UPDATE events 
            SET course_name = ?, 
                course_par = ?, 
                slope_rating = ?, 
                course_rating = ?,
                course_id = ?,
                selected_tee_id = ?
            WHERE date = '2026-05-18'`,
      args: [
        'Ashbourne Golf Club',
        71,
        130,
        72.2,
        'course_ashbourne',
        'tee_ashbourne_white'
      ]
    });
    
    console.log('✅ Fixed Ashbourne WHS values');
    
    return NextResponse.json({
      success: true,
      message: 'Ashbourne WHS values updated: Slope 130, CR 72.2, Par 71'
    });
    
  } catch (error: any) {
    console.error('Fix error:', error);
    return NextResponse.json(
      { error: error.message || 'Fix failed' },
      { status: 500 }
    );
  }
}
