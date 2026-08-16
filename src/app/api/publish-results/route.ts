import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Publish finalized results to members
 * Sets results_published = 1
 */
export async function POST(request: Request) {
  try {
    const { event_id } = await request.json();
    
    if (!event_id) {
      return NextResponse.json({ 
        error: 'Missing event_id' 
      }, { status: 400 });
    }

    const db = getDb();
    
    // Verify event is finalized
    const eventResult = await db.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [event_id]
    });
    
    const event = eventResult.rows[0];
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'finalised') {
      return NextResponse.json({ 
        error: 'Event must be finalized before publishing' 
      }, { status: 400 });
    }

    // Publish results to members
    await db.execute({
      sql: 'UPDATE events SET results_published = 1 WHERE id = ?',
      args: [event_id]
    });

    console.log(`✅ Published results for event: ${event.name}`);

    return NextResponse.json({
      success: true,
      message: 'Results published to members',
      event_id
    });

  } catch (error) {
    console.error('Publish results error:', error);
    return NextResponse.json({
      error: 'Failed to publish results',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
