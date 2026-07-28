import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    const eventId = 'ed9cb595-9745-4af7-acb2-92aac2eb9607';
    
    // First check current value
    const before = await db.execute({
      sql: 'SELECT results_published FROM events WHERE id = ?',
      args: [eventId]
    });
    
    const result = await db.execute({
      sql: 'UPDATE events SET results_published = CAST(1 AS INTEGER) WHERE id = ?',
      args: [eventId]
    });
    
    // Check after
    const after = await db.execute({
      sql: 'SELECT results_published FROM events WHERE id = ?',
      args: [eventId]
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Fixed Malahide results_published',
      rows_affected: result.rowsAffected,
      before: before.rows[0],
      after: after.rows[0]
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
