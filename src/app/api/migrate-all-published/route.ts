import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    
    // Set ALL finalis events to results_published = 1
    const result = await db.execute(`
      UPDATE events 
      SET results_published = 1 
      WHERE status = 'finalised'
    `);
    
    return NextResponse.json({ 
      success: true,
      message: 'Set all finalised events to published',
      rows_affected: result.rowsAffected
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
