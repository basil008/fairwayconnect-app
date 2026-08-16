import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();

    // Create prize_config table
    const sql = `CREATE TABLE IF NOT EXISTS prize_config (
      event_id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`;
    
    await db.execute(sql);

    return NextResponse.json({
      success: true,
      message: 'Prize config table created successfully'
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}
