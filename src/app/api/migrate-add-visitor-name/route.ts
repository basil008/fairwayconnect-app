import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    
    // Add visitor_name column to side_comps table
    await db.execute({
      sql: 'ALTER TABLE side_comps ADD COLUMN visitor_name TEXT'
    });
    
    console.log('✅ Added visitor_name column to side_comps table');
    
    return NextResponse.json({ 
      success: true,
      message: 'Migration complete: visitor_name column added to side_comps'
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    // If column already exists, that's okay
    if (error instanceof Error && error.message.includes('duplicate column')) {
      return NextResponse.json({ 
        success: true,
        message: 'Column already exists'
      });
    }
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
