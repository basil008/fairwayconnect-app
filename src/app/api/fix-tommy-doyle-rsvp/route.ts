import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Check if RSVP already exists
    const existingResult = await db.execute({
      sql: `SELECT id FROM rsvps WHERE event_id = ? AND member_id = ?`,
      args: ['6e52d8e4-94ae-467d-881c-5bda4b12e180', '4df281b0-2114-4c22-a637-8c5d4afbac3e']
    });
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json({ 
        message: 'RSVP already exists', 
        rsvp_id: (existingResult.rows[0] as {id: string}).id 
      });
    }
    
    // Create RSVP for Tommy Doyle - St Margarets
    const rsvpId = 'rsvp_tommy_doyle_stmargarets_' + Date.now();
    
    await db.execute({
      sql: `INSERT INTO rsvps (id, event_id, member_id, status, created_at, can_enter_scores, payment_status, greenfee_status, prize_paid)
            VALUES (?, ?, ?, 'confirmed', datetime('now'), 1, 'unpaid', 'society', 0)`,
      args: [rsvpId, '6e52d8e4-94ae-467d-881c-5bda4b12e180', '4df281b0-2114-4c22-a637-8c5d4afbac3e']
    });
    
    // Verify creation
    const verifyResult = await db.execute({
      sql: `SELECT r.*, m.name FROM rsvps r JOIN members m ON r.member_id = m.id WHERE r.id = ?`,
      args: [rsvpId]
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tommy Doyle RSVP created successfully',
      rsvp: verifyResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating Tommy Doyle RSVP:', error);
    return NextResponse.json({ 
      error: 'Failed to create RSVP',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
