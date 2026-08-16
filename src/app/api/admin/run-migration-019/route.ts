import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Migration 019: Add DNS (Did Not Show) status columns
 * Prevents phantom scorecard issues
 */
export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    
    // Security check
    if (pin !== '2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    
    // Create migrations table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      )
    `);
    
    // Check if already applied
    const checkResult = await db.execute({
      sql: "SELECT name FROM migrations WHERE name = '019_add_dns_status'",
      args: []
    });
    
    if (checkResult.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Migration 019 already applied',
        alreadyApplied: true,
      });
    }

    // Add DNS columns to tee_times (check schema first to avoid errors)
    try {
      await db.execute('ALTER TABLE tee_times ADD COLUMN dns INTEGER DEFAULT 0 NOT NULL');
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) throw e;
    }
    
    try {
      await db.execute('ALTER TABLE tee_times ADD COLUMN dns_reason TEXT');
      await db.execute('ALTER TABLE tee_times ADD COLUMN dns_marked_at TEXT');
      await db.execute('ALTER TABLE tee_times ADD COLUMN dns_marked_by TEXT');
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) throw e;
    }

    // Add DNS columns to scorecards
    try {
      await db.execute('ALTER TABLE scorecards ADD COLUMN dns INTEGER DEFAULT 0 NOT NULL');
      await db.execute('ALTER TABLE scorecards ADD COLUMN dns_reason TEXT');
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) throw e;
    }

    // Add indexes (IF NOT EXISTS handles duplicates)
    await db.execute('CREATE INDEX IF NOT EXISTS idx_tee_times_dns ON tee_times(dns)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_scorecards_dns ON scorecards(dns)');

    // Record migration
    await db.execute({
      sql: "INSERT INTO migrations (name, applied_at) VALUES ('019_add_dns_status', datetime('now'))",
      args: []
    });

    return NextResponse.json({
      success: true,
      message: 'DNS status columns added successfully',
      tablesUpdated: ['tee_times', 'scorecards'],
    });

  } catch (error) {
    console.error('Migration 019 failed:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
