import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/admin/prizes?event_id=xxx
 * Fetch prize configuration for an event
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if prize_config table exists, if not return empty
    const result = await db.execute({
      sql: `SELECT config FROM prize_config WHERE event_id = ?`,
      args: [eventId]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ manual: false, config: null });
    }

    const config = JSON.parse(result.rows[0].config as string);
    return NextResponse.json({ manual: true, config });

  } catch (error: any) {
    console.error('Get prizes error:', error);
    return NextResponse.json({ manual: false, config: null });
  }
}

/**
 * POST /api/admin/prizes
 * Save manual prize configuration
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_id, config } = body;

    if (!event_id || !config) {
      return NextResponse.json(
        { error: 'event_id and config required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Upsert prize configuration
    await db.execute({
      sql: `INSERT INTO prize_config (event_id, config, created_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(event_id) DO UPDATE SET
              config = excluded.config,
              updated_at = datetime('now')`,
      args: [event_id, JSON.stringify(config)]
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Prize configuration saved' 
    });

  } catch (error: any) {
    console.error('Save prizes error:', error);
    return NextResponse.json(
      { error: 'Failed to save prize configuration', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/prizes?event_id=xxx
 * Remove manual prize configuration (revert to auto)
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    const db = getDb();
    
    await db.execute({
      sql: `DELETE FROM prize_config WHERE event_id = ?`,
      args: [eventId]
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Reverted to auto-calculation' 
    });

  } catch (error: any) {
    console.error('Delete prizes error:', error);
    return NextResponse.json(
      { error: 'Failed to delete prize configuration', details: error.message },
      { status: 500 }
    );
  }
}
