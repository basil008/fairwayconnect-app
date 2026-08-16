import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// One-time migration: Add hole_type and nine_names to courses table
export async function POST(request: NextRequest) {
  try {
    const db = getDb();

    // Add columns if they don't exist
    try {
      await db.execute({
        sql: `ALTER TABLE courses ADD COLUMN hole_type TEXT DEFAULT '18'`,
        args: []
      });
      console.log('✅ Added hole_type column');
    } catch (e) {
      console.log('Column hole_type might already exist');
    }

    try {
      await db.execute({
        sql: `ALTER TABLE courses ADD COLUMN nine_names TEXT`,
        args: []
      });
      console.log('✅ Added nine_names column');
    } catch (e) {
      console.log('Column nine_names might already exist');
    }

    return NextResponse.json({
      success: true,
      message: 'Migration complete: courses table updated'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
