import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    
    // Check if column exists
    const tableInfo = await db.execute('PRAGMA table_info(events)');
    const hasColumn = tableInfo.rows.some((row: any) => row.name === 'results_published');
    
    if (hasColumn) {
      return NextResponse.json({ 
        message: 'Column results_published already exists',
        already_exists: true
      });
    }
    
    // Add the column
    await db.execute('ALTER TABLE events ADD COLUMN results_published INTEGER DEFAULT 0');
    
    return NextResponse.json({ 
      success: true,
      message: 'Added results_published column to events table'
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
