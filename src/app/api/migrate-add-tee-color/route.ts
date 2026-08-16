import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    
    // Add tee_color column to events table
    await db.execute({
      sql: 'ALTER TABLE events ADD COLUMN tee_color TEXT',
      args: []
    });
    
    console.log('✅ Added tee_color column to events table');
    
    return NextResponse.json({
      success: true,
      message: 'Added tee_color column to events table'
    });
    
  } catch (error: any) {
    // If column already exists, that's fine
    if (error.message && error.message.includes('duplicate column')) {
      return NextResponse.json({
        success: true,
        message: 'Column already exists'
      });
    }
    
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
