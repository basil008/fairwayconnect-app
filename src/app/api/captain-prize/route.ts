import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Fetch Captain's Prize config for an event
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM captain_prize_config WHERE event_id = ?',
      args: [eventId]
    });

    if (result.rows.length === 0) {
      // Return default config if none exists
      return NextResponse.json({
        event_id: eventId,
        first_overall_amount: 80,
        second_overall_amount: 60,
        third_overall_amount: 40,
        class1_enabled: 1,
        class1_name: 'Class 1',
        class1_handicap_min: 0,
        class1_handicap_max: 18,
        class1_first_amount: 40,
        class1_second_amount: 30,
        class2_enabled: 1,
        class2_name: 'Class 2',
        class2_handicap_min: 19,
        class2_handicap_max: 54,
        class2_first_amount: 40,
        class2_second_amount: 30,
        front9_amount: 25,
        back9_amount: 25,
        longest_drive_amount: 20,
        nearest_pin_amount: 20
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching captain prize config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// POST: Save/Update Captain's Prize config
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_id, ...config } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    // Check if config exists
    const existing = await db.execute({
      sql: 'SELECT id FROM captain_prize_config WHERE event_id = ?',
      args: [event_id]
    });

    if (existing.rows.length > 0) {
      // Update existing
      await db.execute({
        sql: `UPDATE captain_prize_config SET
          first_overall_amount = ?,
          second_overall_amount = ?,
          third_overall_amount = ?,
          class1_enabled = ?,
          class1_name = ?,
          class1_handicap_min = ?,
          class1_handicap_max = ?,
          class1_first_amount = ?,
          class1_second_amount = ?,
          class2_enabled = ?,
          class2_name = ?,
          class2_handicap_min = ?,
          class2_handicap_max = ?,
          class2_first_amount = ?,
          class2_second_amount = ?,
          front9_amount = ?,
          back9_amount = ?,
          longest_drive_amount = ?,
          nearest_pin_amount = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE event_id = ?`,
        args: [
          config.first_overall_amount,
          config.second_overall_amount,
          config.third_overall_amount,
          config.class1_enabled ? 1 : 0,
          config.class1_name,
          config.class1_handicap_min,
          config.class1_handicap_max,
          config.class1_first_amount,
          config.class1_second_amount,
          config.class2_enabled ? 1 : 0,
          config.class2_name,
          config.class2_handicap_min,
          config.class2_handicap_max,
          config.class2_first_amount,
          config.class2_second_amount,
          config.front9_amount,
          config.back9_amount,
          config.longest_drive_amount,
          config.nearest_pin_amount,
          event_id
        ]
      });
      console.log('✅ Updated Captain Prize config for event:', event_id);
    } else {
      // Insert new
      await db.execute({
        sql: `INSERT INTO captain_prize_config (
          event_id,
          first_overall_amount,
          second_overall_amount,
          third_overall_amount,
          class1_enabled,
          class1_name,
          class1_handicap_min,
          class1_handicap_max,
          class1_first_amount,
          class1_second_amount,
          class2_enabled,
          class2_name,
          class2_handicap_min,
          class2_handicap_max,
          class2_first_amount,
          class2_second_amount,
          front9_amount,
          back9_amount,
          longest_drive_amount,
          nearest_pin_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          event_id,
          config.first_overall_amount,
          config.second_overall_amount,
          config.third_overall_amount,
          config.class1_enabled ? 1 : 0,
          config.class1_name,
          config.class1_handicap_min,
          config.class1_handicap_max,
          config.class1_first_amount,
          config.class1_second_amount,
          config.class2_enabled ? 1 : 0,
          config.class2_name,
          config.class2_handicap_min,
          config.class2_handicap_max,
          config.class2_first_amount,
          config.class2_second_amount,
          config.front9_amount,
          config.back9_amount,
          config.longest_drive_amount,
          config.nearest_pin_amount
        ]
      });
      console.log('✅ Created Captain Prize config for event:', event_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error saving captain prize config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
