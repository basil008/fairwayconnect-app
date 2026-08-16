import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    
    // Step 1: Clean up Jack McCabe's trailing space
    await db.execute({
      sql: 'UPDATE members SET name = TRIM(name) WHERE id = ?',
      args: ['mem_1776803799733_g80fx3r1u']
    });

    // Step 2: Check if RSVPs already exist
    const jackRsvp = await db.execute({
      sql: 'SELECT id FROM rsvps WHERE event_id = ? AND member_id = ?',
      args: ['6e52d8e4-94ae-467d-881c-5bda4b12e180', 'mem_1776803799733_g80fx3r1u']
    });

    const tonyRsvp = await db.execute({
      sql: 'SELECT id FROM rsvps WHERE event_id = ? AND member_id = ?',
      args: ['6e52d8e4-94ae-467d-881c-5bda4b12e180', 'db21676f-6f66-4af8-a429-1b7ccef9e35f']
    });

    const actions = [];

    // Step 3: Add RSVP for Jack McCabe if missing
    if (jackRsvp.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO rsvps (id, event_id, member_id, status, payment_status, created_at)
              VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          'rsvp_jack_mccabe_stm',
          '6e52d8e4-94ae-467d-881c-5bda4b12e180',
          'mem_1776803799733_g80fx3r1u',
          'confirmed',
          'unpaid'
        ]
      });
      actions.push('Added RSVP for Jack McCabe');
    } else {
      actions.push('Jack McCabe RSVP already exists');
    }

    // Step 4: Add RSVP for Tony Higgins if missing
    if (tonyRsvp.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO rsvps (id, event_id, member_id, status, payment_status, created_at)
              VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          'rsvp_tony_higgins_stm',
          '6e52d8e4-94ae-467d-881c-5bda4b12e180',
          'db21676f-6f66-4af8-a429-1b7ccef9e35f',
          'confirmed',
          'unpaid'
        ]
      });
      actions.push('Added RSVP for Tony Higgins');
    } else {
      actions.push('Tony Higgins RSVP already exists');
    }

    // Step 5: Get updated count
    const count = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM rsvps WHERE event_id = ?',
      args: ['6e52d8e4-94ae-467d-881c-5bda4b12e180']
    });

    return NextResponse.json({
      success: true,
      actions,
      totalRsvps: count.rows[0].total,
      message: 'RSVP data fixed successfully'
    });

  } catch (error: any) {
    console.error('Fix RSVP error:', error);
    return NextResponse.json(
      { error: 'Failed to fix RSVP data', details: error.message },
      { status: 500 }
    );
  }
}
