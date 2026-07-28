import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json().catch(() => ({}));
    
    const eventId = body.event_id;
    const confirmed = body.confirmed;

    if (!eventId) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    if (!confirmed) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    // Get event details
    const eventResult = await db.execute({
      sql: 'SELECT id, name, status, results_published FROM events WHERE id = ?',
      args: [eventId]
    });

    const event = eventResult.rows[0] as Record<string, unknown> | undefined;
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify prizes have been calculated (results_published exists means /api/finalise was called)
    // Event should still be 'in_progress' at this point

    // Verify not already published
    if (event.results_published === 1) {
      return NextResponse.json({ 
        error: 'Results already published',
        published: true 
      }, { status: 400 });
    }

    // Publish results to members AND mark event as finalised
    console.log(`📢 Publishing event ${eventId}: Setting results_published=1 and status='finalised'`);
    
    const updateResult = await db.execute({
      sql: "UPDATE events SET results_published = 1, status = 'finalised' WHERE id = ?",
      args: [eventId]
    });
    
    console.log(`✅ Publish update complete. Rows affected: ${updateResult.rowsAffected || 'unknown'}`);

    return NextResponse.json({ 
      success: true, 
      message: `Results for "${event.name}" are now visible to all members!`,
      event_id: eventId,
      results_published: true,
      status: 'finalised',
      rows_affected: updateResult.rowsAffected
    });

  } catch (error) {
    console.error('❌ Publish error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Failed to publish results',
      details: errorMessage 
    }, { status: 500 });
  }
}
